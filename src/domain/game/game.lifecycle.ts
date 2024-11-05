import { MessageType } from '~/src/domain/game/dto/game.dto';
import { AuctionGameContext } from './game.context';

export abstract class AuctionGameLifecycle {
  private next;
  private auctionContext: AuctionGameContext;

  constructor(auctionContext: AuctionGameContext) {
    this.auctionContext = auctionContext;
    this.run();
  }
  private async onRoomCreate() {
    this.next = this.onBidCreate;
    await this.onRoomCreated(this.auctionContext);
    console.log('Room Created');
  }
  private async onRoomDestroy() {
    this.next = null;
    await this.onRoomDestroyed(this.auctionContext);
    console.log('Room Destroyed');
  }

  private async onBidCreate() {
    this.next = this.onBidRunnning;
    await this.onBidCreated(this.auctionContext);
    console.log('Bid Created');
  }

  private async onBidRunnning() {
    this.next = this.onBidEnd;
    console.log('Bid Running');
    await this.onBidPhase1(this.auctionContext);
    await this.onBidPhase2(this.auctionContext);
  }

  private async onBidEnd() {
    this.next = this.onRoomDestroy;
    if (!this.onBidEnded(this.auctionContext)) this.next = this.onBidCreate;
    console.log('Bid Ended');
  }

  protected ternimate() {
    this.next = null;
    console.log('Game Ternimated');
  }

  private async run() {
    console.log('Game Start');
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
    new AuctionGame(auctionGameContext);
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
    this.timerEvent = () => {
      auctionContext.sendToClient(null, MessageType.PRICE_UPDATE);
      console.log('timerEvent');
    };
    if (!result) this.ternimate();
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
    auctionContext.activateBid();
    if (auctionContext.getTime() > 30) {
      console.log('Bid Phase 1 start');
      console.log('Bid Phase 1 timer', auctionContext.getTime());
      await this.startTimer(() => auctionContext.getTime() <= 30);
      console.log('Bid Phase 1 end');
    }
  }

  async onBidPhase2(auctionContext: AuctionGameContext) {
    let cnt = 0;
    auctionContext.setUpdateBidEventListener(() => {
      const curtime = auctionContext.getTime();
      let time = 5;

      switch (cnt) {
        case 0:
          time = 30;
          break;
        case 1:
          time = 20;
          break;
        case 2:
          time = 10;
          break;
      }
      time = curtime - (curtime % 10) + 10;
      auctionContext.setTime(time);
      cnt++;
      console.log('Time is updated to', time);
    });
    console.log('Bid Phase 2 start');
    console.log('Bid Phase 2 timer', auctionContext.getTime());
    await this.startTimer(() => auctionContext.getTime() <= 0);
    console.log('Bid Phase 2 end');
  }

  onBidEnded(auctionContext: AuctionGameContext): boolean {
    auctionContext.deactivateBid();
    const result: boolean = auctionContext.isAuctionEnded();
    return result;
  }
}
