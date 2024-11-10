import {
  AuctionGameContext,
  AuctionStatus,
} from '~/src/domain/game/context/game.context';
import {
  findNullAndsetDefaultValue,
  LifecycleFuctionDto,
} from '~/src/domain/game/dto/lifecycle.dto';

export abstract class AuctionGameLifecycle {
  private next: () => Promise<void>;
  private readonly auctionContext: AuctionGameContext;
  private readonly lifecycle: LifecycleFuctionDto;

  constructor(auctionId: string, lifecycle: LifecycleFuctionDto) {
    this.lifecycle = findNullAndsetDefaultValue(lifecycle);

    this.auctionContext = new AuctionGameContext({
      id: auctionId,
    });
  }

  private async onRoomCreate() {
    this.next = this.onBidCreate;
    if (!(await this.lifecycle.jobBeforeRoomCreate(this.auctionContext))) {
      this.ternimate();
      return;
    }
    this.checkValue();
    this.auctionContext.auctionStatus = AuctionStatus.ONGOING;
    await this.onRoomCreated(this.auctionContext);
    if (!(await this.lifecycle.jobAfterRoomCreate(this.auctionContext)))
      this.ternimate();
  }
  private async onRoomDestroy() {
    this.next = null;
    if (!(await this.lifecycle.jobBeforeRoomDestroy(this.auctionContext))) {
      this.ternimate();
      return;
    }
    this.auctionContext.auctionStatus = AuctionStatus.ENDED;
    await this.onRoomDestroyed(this.auctionContext);
    if (!(await this.lifecycle.jobAfterRoomDestroy(this.auctionContext)))
      this.ternimate();
  }

  private async onBidCreate() {
    this.next = this.onBidRunnning;
    if (!(await this.lifecycle.jobBeforeBidCreate(this.auctionContext))) {
      this.ternimate();
      return;
    }
    await this.onBidCreated(this.auctionContext);
    if (!(await this.lifecycle.jobAfterBidCreate(this.auctionContext)))
      this.ternimate();
  }

  private async onBidRunnning() {
    this.next = this.onBidEnd;
    if (!(await this.lifecycle.jobBeforeBidRunning(this.auctionContext))) {
      this.ternimate();
      return;
    }
    await this.onBidPhase1(this.auctionContext);
    await this.onBidPhase2(this.auctionContext);
    if (!(await this.lifecycle.jobAfterBidRunning(this.auctionContext)))
      this.ternimate();
  }

  private async onBidEnd() {
    this.next = this.onRoomDestroy;
    if (!(await this.lifecycle.jobBeforeBidEnd(this.auctionContext))) {
      this.ternimate();
      return;
    }
    if (!(await this.onBidEnded(this.auctionContext)))
      this.next = this.onBidCreate;
    if (!(await this.lifecycle.jobAfterBidEnd(this.auctionContext)))
      this.ternimate();
  }

  protected ternimate() {
    this.next = null;
    this.auctionContext.auctionStatus = AuctionStatus.TERMINATED;
    console.log('Ternimated');
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
  protected startTimer2(callback: () => boolean, time?: number): Promise<void> {
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

  protected executeWithTimer(
    callback: () => Promise<void>,
    seconds: number,
  ): Promise<unknown> {
    return new Promise((resolve) => {
      let timerFinished = false;
      let callbackFinished = false;
      // 타이머 설정
      this.timer = setTimeout(() => {
        timerFinished = true;
        if (callbackFinished) {
          resolve(true);
        }
      }, seconds);

      // 콜백 함수 실행
      callback().then(() => {
        callbackFinished = true;
        if (timerFinished) {
          resolve(true);
        }
      });
    }).finally(() => {
      this.clearTimer();
    });
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

  private readonly checkValue = () =>
    [
      !this.auctionContext.auctionId,
      !this.auctionContext.bidItems,
      !this.auctionContext.auctionStartDateTime,
      !this.auctionContext.auctionStatus,
      !this.auctionContext.auctionTitle,
      !this.auctionContext.currentBidItem,
      !this.auctionContext.sequence,
      !this.auctionContext.budget,
      !this.auctionContext.prevBidPrice,
      !this.auctionContext.prevBidderId,
    ].every((v) => v);
}
