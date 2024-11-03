import { AuctionGameContext } from './game.context';
export abstract class AuctionGameLifecycle {
  private next;
  constructor() {}

  private onRoomCreate(auctionContext: AuctionGameContext) {
    this.next = this.onBidCreate;
    this.onRoomCreated(auctionContext);
    this.next(auctionContext);
  }

  private onRoomDestroy(auctionContext: AuctionGameContext) {
    this.onRoomDestroyed(auctionContext);
  }

  private onBidCreate(auctionContext: AuctionGameContext) {
    this.next = this.onBidReady;
    this.onBidCreated(auctionContext);
    this.next(auctionContext);
  }
  private onBidReady(auctionContext: AuctionGameContext) {
    this.next = this.onBidStart;
    this.next(auctionContext);
  }
  private onBidStart(auctionContext: AuctionGameContext) {
    this.next = this.onBidEnd;
    this.onBidStarted(auctionContext);
    this.next(auctionContext);
  }
  private onBidEnd(auctionContext: AuctionGameContext) {
    this.next = this.onRoomDestroy;
    this.onBidEnded(auctionContext);
    this.next(auctionContext);
  }

  abstract onRoomCreated(auctionContext: AuctionGameContext);
  abstract onRoomDestroyed(auctionContext: AuctionGameContext);
  abstract onBidCreated(auctionContext: AuctionGameContext);
  abstract onBidStarted(auctionContext: AuctionGameContext);
  abstract onBidEnded(auctionContext: AuctionGameContext);

  launch(auctionId: string) {
    console.log('actionId', auctionId);
    const actionContext = new AuctionGameContext();
    new Promise(() => {
      this.onRoomCreate(actionContext);
    });
    return actionContext;
  }
}
