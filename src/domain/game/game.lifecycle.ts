import { MessageType } from '~/src/domain/game/dto/game.dto';
import { AuctionGameContext } from './game.context';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';
import {
  findNullAndsetDefaultValue,
  LifecycleFuctionDto,
} from '~/src/domain/game/dto/lifecycle.dto';

export abstract class AuctionGameLifecycle {
  private next: () => Promise<void>;
  private readonly auctionContext: AuctionGameContext;
  private readonly lifecycle: LifecycleFuctionDto;

  constructor(
    auctionContext: AuctionGameContext,
    lifecycle: LifecycleFuctionDto,
  ) {
    this.auctionContext = auctionContext;
    this.lifecycle = findNullAndsetDefaultValue(lifecycle);
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
  /**
   *
   * 다음 경매 아이템이 존재한다면 false를 반환해야 합니다.
   */
  abstract onBidEnded(auctionContext: AuctionGameContext): Promise<boolean>;

  static launch(
    auctionGameContext: AuctionGameContext,
    lifecycle: LifecycleFuctionDto,
  ) {
    new AuctionGame(auctionGameContext, lifecycle).run();
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

    auctionContext.notifyToClient({
      type: 'AUCTION_END',
    });
  }

  async onBidCreated(auctionContext: AuctionGameContext) {
    const bidItem = auctionContext.setNextBidItem();
    if (!bidItem) this.ternimate();
    auctionContext.notifyToClient({
      type: 'BID_READY',
      itemId: bidItem.itemId,
      bidPrice: bidItem.startPrice,
      title: bidItem.title,
    });

    this.timerEvent = () => {
      auctionContext.sendToClient(null, MessageType.TIME_UPDATE, {
        time: auctionContext.getTime(),
      });
    };

    await this.delay(5000);
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
    auctionContext.deactivateBid();
    const bidItem = auctionContext.currentBidItem;
    const userData: UserDataDto = auctionContext.getUserDataById(
      bidItem.bidderId,
    );

    auctionContext.notifyToClient({
      type: 'BID_END',
      itemId: bidItem.itemId,
      bidPrice: bidItem.bidPrice,
      name: userData?.name,
      title: bidItem.title,
    });
    const result: boolean = auctionContext.isAuctionEnded();
    await this.delay(10000);

    console.log('Bid Ended', auctionContext.currentBidItem.title);
    return result;
  }
}
