import { MessageType } from '~/src/domain/game/dto/game.dto';
import { AuctionGameContext } from './game.context';

export abstract class AuctionGameLifecycle {
  private next: () => Promise<void>;
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
    if (!(await this.onBidEnded(this.auctionContext)))
      this.next = this.onBidCreate;
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
  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
  abstract onBidEnded(auctionContext: AuctionGameContext): Promise<boolean>;

  static launch(auctionGameContext: AuctionGameContext) {
    new AuctionGame(auctionGameContext).run();
    return {
      message: 'Auction Started',
    };
  }
}

export class AuctionGame extends AuctionGameLifecycle {
  async onRoomCreated(auctionContext: AuctionGameContext) {
    await auctionContext.loadFromDB();
    console.log('Auction Created', auctionContext.auctionTitle);
  }

  async onRoomDestroyed(auctionContext: AuctionGameContext) {
    await auctionContext.saveToDB();
    console.log('Auction Destroyed', auctionContext.auctionTitle);
  }

  onBidCreated(auctionContext: AuctionGameContext) {
    const bidItem = auctionContext.setNextBidItem();
    if (!bidItem) this.ternimate();
    this.timerEvent = () => {
      auctionContext.sendToClient(null, MessageType.TIME_UPDATE, {
        time: auctionContext.getTime(),
      });
    };
    auctionContext.activateBid();
    auctionContext.notifyToClient({
      type: 'BID_START',
      itemId: bidItem.itemId,
      bidPrice: bidItem.startPrice,
      bidderId: null,
      title: bidItem.title,
    });

    console.log('Bid Created', bidItem.title);
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

    console.log('Bid Phase 1 Ended');
  }

  async onBidPhase2(auctionContext: AuctionGameContext) {
    let max = 30;
    auctionContext.setUpdateBidEventListener(() => {
      const curtime = auctionContext.getTime();
      if (curtime <= 20 && curtime > 10) max = 20;
      else if (curtime <= 10) max = 10;
      auctionContext.setTime(max);
    });
    await this.startTimer(() => auctionContext.getTime() <= 0);
    console.log('Bid Phase 2 Ended');
  }

  async onBidEnded(auctionContext: AuctionGameContext): Promise<boolean> {
    const bidItem = auctionContext.currentBidItem;
    const userData = auctionContext.getUserDataById(bidItem.bidderId);
    auctionContext.deactivateBid();
    auctionContext.notifyToClient({
      type: 'BID_END',
      itemId: bidItem.itemId,
      bidPrice: bidItem.bidPrice,
      name: userData.name,
      title: bidItem.title,
    });
    const result: boolean = auctionContext.isAuctionEnded();
    await this.delay(60000);

    console.log('Bid Ended', auctionContext.currentBidItem.title);
    return result;
  }
}
