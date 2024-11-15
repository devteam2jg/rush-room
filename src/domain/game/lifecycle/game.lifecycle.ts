import {
  AuctionGameContext,
  BidItem,
} from '~/src/domain/game/context/game.context';
import { AuctionGameLifecycle } from '~/src/domain/game/lifecycle/game-abstraction.lifecycle';
import {
  AuctionUserDataDto,
  MessageType,
  UpdateBidPriceDto,
} from '~/src/domain/game/dto/game.dto';
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
  async onRoomCreated(context: AuctionGameContext) {
    context.setUpdateBidEventListener(this.updateEvent);
  }

  async onBidCreated(context: AuctionGameContext) {
    this.timerEvent = () => {
      context.sendToClient(null, MessageType.TIME_UPDATE, {
        time: context.getTime(),
      });
    };
    const bidItem: BidItem = context.setNextBidItem();
    if (!bidItem) {
      this.ternimate();
      return;
    }
    context.notifyToClient({
      type: 'BID_READY',
      itemId: bidItem.itemId,
      bidPrice: bidItem.startPrice,
      sellerId: bidItem.sellerId,
      title: bidItem.title,
    });
    context.alertToClient({
      type: 'YELLOW',
      message: '잠시후 경매가 시작됩니다.',
    });
    await this.delay(5000);
    context.activateBid();
    context.notifyToClient({
      type: 'BID_START',
      itemId: bidItem.itemId,
      bidPrice: bidItem.startPrice,
      bidderId: null,
      title: bidItem.title,
      anon: bidItem.canBidAnonymous,
    });
    context.alertToClient({
      type: 'GREEN',
      message: '경매가 시작 되었습니다. ',
    });
  }

  async onBidPhase1(context: AuctionGameContext) {
    context.setTimeEventListener(async (updateDto: UpdateBidPriceDto) => {
      const prevPrice = context.prevBidPrice;
      const currentPrice = context.currentBidItem.bidPrice;
      const subPrice = currentPrice - prevPrice;
      const percent = updateDto.percent ? updateDto.percent : null;

      if (percent) {
        if (percent == 5 && subPrice < 1500) return;
        if (percent == 10 && subPrice < 3000) return;
        if (percent == 20 && subPrice < 6000) return;
      } else if (currentPrice <= 30000) return;
      if (!percent) {
        return;
      }
      let newTime = await this.auctionTimeService.calculateNewRemainingTime(
        context.auctionId,
        prevPrice,
        currentPrice,
        context.getTime(),
      );
      if (newTime < 15) newTime = 15;
      const currentT = context.getTime();
      context.setTime(newTime);
      context.sendToClient(null, MessageType.TIME, {
        type: 'SUB',
        time: context.getTime(),
        differ: currentT - newTime,
      });
    });
    if (context.getTime() > 15) {
      context.alertToClient({
        type: 'YELLOW',
        message: '경매 Phase 1 시작 \n입찰가격에 따라 시간이 감소합니다.',
      });
      await this.startTimer(
        () => context.getTime() <= 15 || context.isTerminated(),
      );
    }
  }

  async onBidPhase2(context: AuctionGameContext) {
    let max = 15;
    context.setTimeEventListener((updateDto: UpdateBidPriceDto) => {
      const curtime = context.getTime();
      if (curtime <= 15 && curtime > 10) max = 15;
      if (curtime <= 10 && curtime > 5) max = 10;
      else if (curtime <= 5) max = 5;
      context.setTime(max);

      context.sendToClient(null, MessageType.TIME, {
        type: 'ADD',
        time: context.getTime(),
        differ: max - curtime,
      });
    });
    context.sendToClient(null, MessageType.NOTIFICATION, {
      type: 'RUSH_TIME',
    });
    context.alertToClient({
      type: 'YELLOW',
      message: '경매 Phase 2 시작 \n남은 시간이 초기화 됩니다.',
    });
    await this.startTimer(
      () => context.getTime() <= 6 || context.isTerminated(),
    );
    this.timerEvent = () => {
      context.sendToClient(null, MessageType.TIME_UPDATE, {
        time: context.getTime(),
      });
      context.sendToClient(null, MessageType.FINAL_TIME, {
        time: context.getTime(),
      });
    };
    await this.startTimer(
      () => context.getTime() <= 0 || context.isTerminated(),
    );
  }

  async onBidEnded(context: AuctionGameContext): Promise<boolean> {
    context.deactivateBid();
    const bidItem = context.currentBidItem;
    const user: AuctionUserDataDto = context.getUserDataById(bidItem.bidderId);
    if (user) {
      user.budget -= bidItem.bidPrice;
      bidItem.buyerId = user.id;
      bidItem.isSold = true;
    }
    context.notifyToClient({
      type: 'BID_END',
      itemId: bidItem.itemId,
      bidPrice: bidItem.bidPrice,
      name: user ? user.name : null,
      title: bidItem.title,
      profileUrl: user ? user.profileUrl : null,
    });
    context.resetUsersBidPrice();
    await this.delay(10000);
    return context.isAuctionEnded();
  }

  async onRoomDestroyed(context: AuctionGameContext) {
    context.alertToClient({
      type: 'YELLOW',
      message: '경매가 종료되었습니다.',
    });

    context.notifyToClient({
      type: 'AUCTION_END',
      data: context.getResults(),
    });
  }

  private readonly updateEvent = async (
    updateBidPriceDto: UpdateBidPriceDto,
    context: AuctionGameContext,
  ) => {
    const { bidPrice, bidderId, bidderNickname, socketId } = updateBidPriceDto;
    const user: AuctionUserDataDto = context.getUserDataById(bidderId);
    if (!context.currentBidItem.canBid) {
      context.sendToClient(socketId, MessageType.ALERT, {
        type: 'RED',
        message: '입찰이 불가능한 상태입니다',
      });
      return {
        status: 'fail',
        bidPrice: context.currentBidItem.bidPrice,
        budget: user.budget - user.bidPrice,
      };
    }

    if (bidPrice <= context.currentBidItem.bidPrice) {
      context.sendToClient(socketId, MessageType.ALERT, {
        type: 'RED',
        message: '더 높은 가격을 입력해주세요',
      });
      return {
        status: 'fail',
        bidPrice: context.currentBidItem.bidPrice,
        budget: user.budget - user.bidPrice,
      };
    }
    if (user.budget < bidPrice) {
      context.sendToClient(socketId, MessageType.ALERT, {
        type: 'RED',
        message: '예산이 부족합니다.',
      });
      return {
        budget: user.budget - user.bidPrice,
        bidPrice: context.currentBidItem.bidPrice,
        status: 'fail',
      };
    }
    user.bidPrice = bidPrice;
    context.prevBidPrice = context.currentBidItem.bidPrice;
    context.prevBidderId = context.currentBidItem.bidderId;
    context.currentBidItem.bidPrice = bidPrice;
    context.currentBidItem.bidderId = bidderId;
    context.currentBidItem.bidder = user;

    if (context.prevSocketId && context.prevSocketId != socketId) {
      context.sendToClient(context.prevSocketId, MessageType.ALERT, {
        type: 'YELLOW',
        message: '다른 사용자가 입찰을 하였습니다',
      });
    }
    context.prevSocketId = socketId;

    context.sendToClient(socketId, MessageType.ALERT, {
      type: 'GREEN',
      message: '입찰이 완료되었습니다',
    });
    context.sendToClient(null, MessageType.TIME_UPDATE, {
      time: context.getTime(),
    });
    context.sendToClient(null, MessageType.PRICE_UPDATE, {
      bidderNickname,
      bidPrice: context.currentBidItem.bidPrice,
      bidderId: context.currentBidItem.bidderId,
    });

    return {
      status: 'success',
      bidPrice: context.currentBidItem.bidPrice,
      budget: user.budget - user.bidPrice,
    };
  };
}
