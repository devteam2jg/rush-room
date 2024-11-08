import {
  AuctionGameContext,
  BidItem,
} from '~/src/domain/game/context/game.context';
import { AuctionGameLifecycle } from '~/src/domain/game/lifecycle/game-abstraction.lifecycle';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';
import { MessageType } from '~/src/domain/game/dto/game.dto';
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
    console.log('Bid Ended', userData);
    auctionContext.notifyToClient({
      type: 'BID_END',
      itemId: bidItem.itemId,
      bidPrice: bidItem.bidPrice,
      name: userData ? userData.name : null,
      title: bidItem.title,
    });
    const result: boolean = auctionContext.isAuctionEnded();
    await this.delay(10000);

    console.log('Bid Ended', auctionContext.currentBidItem.title);
    return result;
  }

  async onRoomDestroyed(auctionContext: AuctionGameContext) {
    console.log('Auction Destroyed', auctionContext.auctionTitle);

    auctionContext.notifyToClient({
      type: 'AUCTION_END',
      bidItems: auctionContext.bidItems,
    });
  }
}
