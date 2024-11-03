import { AuctionGameContext } from './game.context';
export abstract class AuctionGameLifecycle {
  private next;
  private auctionContext: AuctionGameContext;
  constructor(auctionContext: AuctionGameContext) {
    this.auctionContext = auctionContext;
  }

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
    new Promise(() => {
      this.onRoomCreate(this.auctionContext);
    });
    return this.auctionContext;
  }
}
export class AuctionGame extends AuctionGameLifecycle {
  constructor(auctionContext: AuctionGameContext) {
    super(auctionContext);
  }
  onRoomCreated(auctionContext: AuctionGameContext) {
    console.log('onRoomCreated', auctionContext);
  }

  onRoomDestroyed(auctionContext: AuctionGameContext) {
    console.log('onRoomDestroyed', auctionContext);
  }

  onBidCreated(auctionContext: AuctionGameContext) {
    console.log('onBidCreated', auctionContext);
  }

  onBidStarted(auctionContext: AuctionGameContext) {
    console.log('onBidStarted', auctionContext);
  }

  onBidEnded(auctionContext: AuctionGameContext) {
    console.log('onBidEnded', auctionContext);
  }
}
