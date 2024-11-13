import {
  AuctionGameContext,
  BidItem,
} from '~/src/domain/game/context/game.context';
import { AuctionGameLifecycle } from '~/src/domain/game/lifecycle/game-abstraction.lifecycle';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';
import { MessageType, UpdateBidPriceDto } from '~/src/domain/game/dto/game.dto';
import { Injectable } from '@nestjs/common';
import { AuctionTimeService } from '~/src/domain/game/services/game.time.service';
import { LifecycleFuctionDto } from '~/src/domain/game/dto/lifecycle.dto';

@Injectable()
export class AuctionGameFactory {
  constructor(private readonly auctionTimeService: AuctionTimeService) {}

  launch(auctionId: string, lifecycle: LifecycleFuctionDto) {
    new AuctionGame(auctionId, lifecycle, this.auctionTimeService).run();
    return {
      message: 'Auction Started',
    };
  }
}

export class AuctionGame extends AuctionGameLifecycle {
  async onRoomCreated(auctionContext: AuctionGameContext) {
    console.log('Auction Created', auctionContext.auctionTitle);
  }

  async onBidCreated(auctionContext: AuctionGameContext) {
    const bidItem: BidItem = auctionContext.setNextBidItem();
    if (!bidItem) {
      this.ternimate();
      return;
    }
    auctionContext.notifyToClient({
      type: 'BID_READY',
      itemId: bidItem.itemId,
      bidPrice: bidItem.startPrice,
      sellerId: bidItem.sellerId,
      title: bidItem.title,
    });

    this.timerEvent = () => {
      auctionContext.sendToClient(null, MessageType.TIME_UPDATE, {
        time: auctionContext.getTime(),
      });
    };
    auctionContext.alertToClient({
      type: 'YELLOW',
      message: '잠시후 경매가 시작됩니다.',
    });
    await this.delay(5000);
    auctionContext.activateBid();
    auctionContext.notifyToClient({
      type: 'BID_START',
      itemId: bidItem.itemId,
      bidPrice: bidItem.startPrice,
      bidderId: null,
      title: bidItem.title,
      anon: bidItem.canBidAnonymous,
    });
    auctionContext.alertToClient({
      type: 'GREEN',
      message: '경매가 시작 되었습니다. ',
    });

    console.log('Bid Created', bidItem.title);
  }

  async onBidPhase1(auctionContext: AuctionGameContext) {
    auctionContext.setUpdateBidEventListener(
      async (updateDto: UpdateBidPriceDto) => {
        const prevPrice = auctionContext.prevBidPrice;
        const currentPrice = auctionContext.currentBidItem.bidPrice;
        const subPrice = currentPrice - prevPrice;
        const { percent } = updateDto;

        if (percent) {
          if (percent == 5 && subPrice < 10000) return;
          if (percent == 10 && subPrice < 20000) return;
          if (percent == 20 && subPrice < 50000) return;
        } else if (currentPrice < 10000) return;
        if (!percent) {
          return;
        }
        const newTime = await this.auctionTimeService.calculateNewRemainingTime(
          auctionContext.auctionId,
          prevPrice,
          currentPrice,
          auctionContext.getTime(),
        );

        const currentT = auctionContext.getTime();
        auctionContext.setTime(newTime);
        console.log(prevPrice, currentPrice, currentT, newTime);
        auctionContext.sendToClient(null, MessageType.TIME, {
          type: 'SUB',
          time: auctionContext.getTime(),
          differ: currentT - newTime,
        });
      },
    );
    auctionContext.alertToClient({
      type: 'YELLOW',
      message: '경매 Phase 1 시작 \n입찰가격에 따라 시간이 감소합니다.',
    });
    if (auctionContext.getTime() > 30) {
      await this.startTimer(() => auctionContext.getTime() <= 15);
    }

    console.log('Bid Phase 1 Ended');
  }

  async onBidPhase2(auctionContext: AuctionGameContext) {
    let max = 15;
    auctionContext.setUpdateBidEventListener((updateDto: UpdateBidPriceDto) => {
      const curtime = auctionContext.getTime();
      if (curtime <= 15 && curtime > 5) max = 15;
      else if (curtime <= 5) max = 5;
      auctionContext.setTime(max);

      auctionContext.sendToClient(null, MessageType.TIME, {
        type: 'ADD',
        time: auctionContext.getTime(),
        differ: max - curtime,
      });
    });
    auctionContext.sendToClient(null, MessageType.NOTIFICATION, {
      type: 'RUSH_TIME',
    });
    auctionContext.alertToClient({
      type: 'YELLOW',
      message: '경매 Phase 2 시작 \n남은 시간이 초기화 됩니다.',
    });

    await this.startTimer(() => auctionContext.getTime() <= 6);
    this.timerEvent = () => {
      auctionContext.sendToClient(null, MessageType.TIME_UPDATE, {
        time: auctionContext.getTime(),
      });
      auctionContext.sendToClient(null, MessageType.FINAL_TIME, {
        time: auctionContext.getTime(),
      });
    };
    await this.startTimer(() => auctionContext.getTime() <= 0);
    console.log('Bid Phase 2 Ended');
  }

  async onBidEnded(auctionContext: AuctionGameContext): Promise<boolean> {
    auctionContext.deactivateBid();
    const bidItem = auctionContext.currentBidItem;
    const userData: UserDataDto = auctionContext.getUserDataById(
      bidItem.bidderId,
    );
    console.log('Bid Ended', userData);
    auctionContext.notifyToClient({
      type: 'BID_END',
      itemId: bidItem.itemId,
      bidPrice: bidItem.bidPrice,
      name: userData ? userData.name : null,
      title: bidItem.title,
    });
    const user = auctionContext.getUserDataById(bidItem.bidderId);
    if (user) {
      user.budget -= bidItem.bidPrice;
    }

    await this.delay(10000);

    console.log('Bid Ended', auctionContext.currentBidItem.title);
    return auctionContext.isAuctionEnded();
  }

  async onRoomDestroyed(auctionContext: AuctionGameContext) {
    console.log('Auction Destroyed', auctionContext.auctionTitle);
    auctionContext.alertToClient({
      type: 'YELLOW',
      message: '경매가 종료되었습니다.',
    });

    auctionContext.notifyToClient({
      type: 'AUCTION_END',
    });
  }
}
