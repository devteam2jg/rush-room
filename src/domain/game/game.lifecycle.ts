import { MessageType } from '~/src/domain/game/dto/game.dto';
import { AuctionGameContext } from './game.context';

export abstract class AuctionGameLifecycle {
  private next;
  private readonly auctionContext: AuctionGameContext;

  constructor(auctionContext: AuctionGameContext) {
    this.auctionContext = auctionContext;
  }
  private async onRoomCreate() {
    this.next = this.onBidCreate;
    await this.onRoomCreated(this.auctionContext);
  }
  private async onRoomDestroy() {
    this.next = null;
    await this.onRoomDestroyed(this.auctionContext);
  }

  private async onBidCreate() {
    this.next = this.onBidRunnning;
    await this.onBidCreated(this.auctionContext);
  }

  private async onBidRunnning() {
    this.next = this.onBidEnd;
    await this.onBidPhase1(this.auctionContext);
    await this.onBidPhase2(this.auctionContext);
  }

  private async onBidEnd() {
    this.next = this.onRoomDestroy;
    if (!this.onBidEnded(this.auctionContext)) this.next = this.onBidCreate;
  }

  protected ternimate() {
    this.next = null;
  }

  async run() {
    this.next = this.onRoomCreate;
    while (this.next) {
      await this.next();
    }
  }
  private timer: NodeJS.Timeout | null = null;
  protected timerEvent: () => void;
  protected startTimer(callback: () => boolean): Promise<void> {
    return new Promise((resolve) => {
      this.clearTimer();
      this.timer = setInterval(() => {
        this.auctionContext.timerInterrupt();
        this.timerEvent();
        if (callback()) {
          this.clearTimer();
          resolve();
        }
      }, 1000);
    });
  }
  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  abstract onRoomCreated(auctionContext: AuctionGameContext);
  abstract onRoomDestroyed(auctionContext: AuctionGameContext);
  abstract onBidCreated(auctionContext: AuctionGameContext);
  abstract onBidPhase1(auctionContext: AuctionGameContext);
  abstract onBidPhase2(auctionContext: AuctionGameContext);
  /**
   *
   * 다음 경매 아이템이 존재한다면 false를 반환해야 합니다.
   */
  abstract onBidEnded(auctionContext: AuctionGameContext): boolean;

  static launch(auctionGameContext: AuctionGameContext) {
    new AuctionGame(auctionGameContext).run();
  }
}

export class AuctionGame extends AuctionGameLifecycle {
  async onRoomCreated(auctionContext: AuctionGameContext) {
    await auctionContext.loadFromDB();
  }

  async onRoomDestroyed(auctionContext: AuctionGameContext) {
    await auctionContext.saveToDB();
  }

  onBidCreated(auctionContext: AuctionGameContext) {
    const result = auctionContext.setNextBidItem();
    if (!result) this.ternimate();
    this.timerEvent = () => {
      auctionContext.sendToClient(null, MessageType.TIME_UPDATE, {
        time: auctionContext.getTime(),
      });
    };
    auctionContext.activateBid();
    auctionContext.notifyAuctionStart();
  }

  async onBidPhase1(auctionContext: AuctionGameContext) {
    auctionContext.setUpdateBidEventListener(() => {
      const prevPrice = auctionContext.prevBidPrice;
      const currentPrice = auctionContext.currentBidItem.bidPrice;
      const subPrice = currentPrice - prevPrice;

      if (subPrice >= 20000) {
        auctionContext.subTime(5);
      } else if (subPrice > 30000) {
        auctionContext.subTime(10);
      } else if (subPrice > 50000) {
        auctionContext.subTime(30);
      }
    });

    if (auctionContext.getTime() > 30) {
      await this.startTimer(() => auctionContext.getTime() <= 30);
    }
  }

  async onBidPhase2(auctionContext: AuctionGameContext) {
    auctionContext.setUpdateBidEventListener(() => {
      const curtime = auctionContext.getTime();
      const time = ((curtime / 10) | 0) * 10 + 10;
      auctionContext.setTime(time);
    });
    await this.startTimer(() => auctionContext.getTime() <= 0);
  }

  onBidEnded(auctionContext: AuctionGameContext): boolean {
    auctionContext.deactivateBid();
    auctionContext.notifyAuctionEnd();
    const result: boolean = auctionContext.isAuctionEnded();
    return result;
  }
}
