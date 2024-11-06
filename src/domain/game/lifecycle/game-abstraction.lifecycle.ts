import { AuctionGameContext } from '~/src/domain/game/context/game.context';
import { AuctionGame } from '~/src/domain/game/lifecycle/game.lifecycle';
import {
  findNullAndsetDefaultValue,
  LifecycleFuctionDto,
} from '~/src/domain/game/dto/lifecycle.dto';

export abstract class AuctionGameLifecycle {
  private next: () => Promise<void>;
  private readonly auctionContext: AuctionGameContext;
  private readonly lifecycle: LifecycleFuctionDto;

  constructor(lifecycle: LifecycleFuctionDto) {
    this.lifecycle = findNullAndsetDefaultValue(lifecycle);

    this.auctionContext = new AuctionGameContext({
      id: lifecycle.auctionId,
    })
      .setLoadEventListener(lifecycle.loadEvent)
      .setSaveEventListener(lifecycle.saveEvent)
      .setSocketEventListener(lifecycle.socketEvent);
  }
  private async onRoomCreate() {
    this.next = this.onBidCreate;
    await this.lifecycle.jobBeforeRoomCreate(this.auctionContext);
    await this.onRoomCreated(this.auctionContext);
    await this.lifecycle.jobAfterRoomCreate(this.auctionContext);
  }
  private async onRoomDestroy() {
    this.next = null;
    await this.lifecycle.jobBeforeRoomDestroy(this.auctionContext);
    await this.onRoomDestroyed(this.auctionContext);
    await this.lifecycle.jobAfterRoomDestroy(this.auctionContext);
  }

  private async onBidCreate() {
    this.next = this.onBidRunnning;
    await this.lifecycle.jobBeforeBidCreate(this.auctionContext);
    await this.onBidCreated(this.auctionContext);
    await this.lifecycle.jobAfterBidCreate(this.auctionContext);
  }

  private async onBidRunnning() {
    this.next = this.onBidEnd;
    await this.lifecycle.jobBeforeBidRunning(this.auctionContext);
    await this.onBidPhase1(this.auctionContext);
    await this.onBidPhase2(this.auctionContext);
    await this.lifecycle.jobAfterBidRunning(this.auctionContext);
  }

  private async onBidEnd() {
    this.next = this.onRoomDestroy;
    await this.lifecycle.jobBeforeBidEnd(this.auctionContext);
    if (!(await this.onBidEnded(this.auctionContext)))
      this.next = this.onBidCreate;
    await this.lifecycle.jobAfterBidEnd(this.auctionContext);
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
  abstract onBidEnded(auctionContext: AuctionGameContext): Promise<boolean>;

  static launch(lifecycle: LifecycleFuctionDto) {
    new AuctionGame(lifecycle).run();
    return {
      message: 'Auction Started',
    };
  }
}
