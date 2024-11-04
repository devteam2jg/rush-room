import { AuctionGameContext } from './game.context';

export abstract class AuctionGameLifecycle {
  private next;
  private auctionContext: AuctionGameContext;

  constructor(auctionContext: AuctionGameContext) {
    this.auctionContext = auctionContext;
    this.run();
  }
  private onRoomCreate() {
    this.next = this.onBidCreate;
    this.onRoomCreated(this.auctionContext);
  }
  private onRoomDestroy() {
    this.next = null;
    this.onRoomDestroyed(this.auctionContext);
  }

  private onBidCreate() {
    this.next = this.onBidRunnning;
    this.onBidCreated(this.auctionContext);
  }

  private async onBidRunnning() {
    this.next = this.onBidEnd;
    this.onBidPhase1(this.auctionContext);
    this.onBidPhase2(this.auctionContext);
  }

  private onBidEnd() {
    this.next = this.onRoomDestroy;
    if (!this.onBidEnded(this.auctionContext)) this.next = this.onBidCreate;
  }

  protected ternimate() {
    this.next = null;
  }

  private run() {
    this.next = this.onRoomCreate;
    while (this.next) {
      this.next();
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
    new Promise(() => {
      const game = new AuctionGame(auctionGameContext);
      console.log('Game End', game);
    });
  }
}

export class AuctionGame extends AuctionGameLifecycle {
  onRoomCreated(auctionContext: AuctionGameContext) {
    auctionContext.loadFromDB();
  }

  onRoomDestroyed(auctionContext: AuctionGameContext) {
    auctionContext.saveToDB();
  }

  onBidCreated(auctionContext: AuctionGameContext) {
    const result = auctionContext.setNextBidItem();
    if (!result) this.ternimate();
  }

  async onBidPhase1(auctionContext: AuctionGameContext) {
    auctionContext.setUpdateBidEventListener(() => {
      const prevPrice = auctionContext.prevBidPrice;
      const currentPrice = auctionContext.currentBidItem.bidPrice;
      const time = auctionContext.currentBidItem.itemSellingLimitTime;
      const subPrice = currentPrice - prevPrice;

      if (subPrice >= 20000) {
        auctionContext.setTime(time - 5);
      } else if (subPrice > 30000) {
        auctionContext.setTime(time - 10);
      } else if (subPrice > 50000) {
        auctionContext.setTime(time - 30);
      }
    });
    auctionContext.activateBid();

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { time } = auctionContext.getCurrentBidItemInfo();
      if (time < 30) break;
    }
  }

  async onBidPhase2(auctionContext: AuctionGameContext) {
    let cnt = 0;
    auctionContext.setUpdateBidEventListener(() => {
      if (cnt == 0) {
        auctionContext.setTime(30);
        cnt++;
      } else if (cnt == 1) {
        auctionContext.setTime(20);
        cnt++;
      } else if (cnt == 2) {
        auctionContext.setTime(10);
        cnt++;
      } else {
        auctionContext.setTime(5);
      }
    });
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { time } = auctionContext.getCurrentBidItemInfo();
      if (time <= 0) break;
    }
  }

  onBidEnded(auctionContext: AuctionGameContext): boolean {
    auctionContext.deactivateBid();
    const result: boolean = auctionContext.isAuctionEnded();
    return result;
  }
}
