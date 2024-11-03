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
    while (this.auctionContext.auctionStatus === 'ONGOING') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private onBidEnd(auctionContext: AuctionGameContext) {
    this.next = this.onRoomDestroy;
    if (!this.onBidEnded(auctionContext)) this.next = this.onBidCreate;
  }

  protected ternimate() {
    this.next = this.onRoomDestroy;
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
  /**
   *
   * 다음 경매 아이템이 존재한다면 false를 반환해야 합니다.
   */
  abstract onBidEnded(auctionContext: AuctionGameContext): boolean;

  static launch(auctionGameContext: AuctionGameContext) {
    new Promise(() => {
      const game = new AuctionGame(auctionGameContext);
      console.log('game', game);
    });
    return auctionGameContext;
  }
}
export class AuctionGame extends AuctionGameLifecycle {
  onRoomCreated(auctionContext: AuctionGameContext) {
    console.log('onRoomCreated', auctionContext);
  }
  onRoomDestroyed(auctionContext: AuctionGameContext) {
    console.log('onRoomDestroyed', auctionContext);
  }
  onBidCreated(auctionContext: AuctionGameContext) {
    console.log('onBidCreated', auctionContext);
  }
  onBidEnded(auctionContext: AuctionGameContext): boolean {
    console.log('onBidEnded', auctionContext);
    return true;
  }
}
