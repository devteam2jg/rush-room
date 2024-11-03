import { Injectable } from '@nestjs/common';
import { AuctionGameContext, BidItem } from './game.context';
import { AuctionService } from '~/src/domain/auction/auction.service';

@Injectable()
export class GameService {
  constructor(private readonly auctionService: AuctionService) {}

  private auctionsMap: Map<string, AuctionGameContext> = new Map();

  // 경매 정보를 가져와서 경매 게임 컨텍스트를 생성
  async createGameContext(auctionId: string, auctionitemId) {
    const auction = await this.auctionService.getAuctionDetail(
      auctionId,
      auctionitemId,
    );
    const bidItems: BidItem[] = auction.items.map((item) => ({
      itemId: item.id,
      sellerId: item.postedUser,
      startPrice: item.startPrice,
      bidPrice: item.startPrice,
      bidderId: '',
      itemSellingLimitTime: auction.auctionDto.sellingLimitTime,
      title: item.title,
      description: item.description,
      picture: item.imageUrls,
    }));
    const auctionGameContext = new AuctionGameContext(
      auctionId,
      auction.auctionDto.eventDate,
      bidItems,
    );
    this.auctionsMap.set(auctionId, auctionGameContext);
    return auctionGameContext;
  }

  // 경매 참여 시 현재 입찰가 제공
  joinAuctionGiveCurrentBid(auctionId, auctionItemId) {
    const auction = this.auctionsMap.get(auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }
    return auction.bidItems.find((item) => item.itemId === auctionItemId)
      ?.bidPrice;
  }

  // 경매 가격 제안
  updateBidPrice(auctionId, auctionItemId, bidPrice, bidderId) {
    const auction = this.auctionsMap.get(auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }
    const bidItem = auction.bidItems.find(
      (item) => item.itemId === auctionItemId,
    );
    if (!bidItem) {
      throw new Error('Item not found');
    }
    if (bidPrice <= bidItem.bidPrice) {
      throw new Error('Bid price should be higher than current bid price');
    }
    bidItem.bidPrice = bidPrice;
    bidItem.bidderId = bidderId;
  }
}
