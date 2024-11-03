import { Injectable } from '@nestjs/common';
import { AuctionGameContext, BidItem } from './game.context';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { AuctionGameLifecycle } from './game.lifecycle';

@Injectable()
export class GameService {
  constructor(private readonly auctionService: AuctionService) {}

  private auctionsMap: Map<string, AuctionGameContext> = new Map();

  // 경매 정보를 가져와서 경매 게임 컨텍스트를 생성
  private async createGameContext(auctionId: string) {
    // auctionID로 모든 itme ID 가져오기
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

    auctionGameContext.setSaveEvent(() => {
      // DB에 저장하는 로직
    });

    return auctionGameContext;
  }

  // 경매 참여 시 현재 입찰가 제공
  joinAuctionGiveCurrentBid(auctionId) {
    const auction = this.auctionsMap.get(auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }
    return auction.getCurrentBidItemInfo();
  }

  // 경매 가격 제안
  updateBidPrice(auctionId, bidPrice, bidderId): boolean {
    const auction = this.auctionsMap.get(auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }
    return auction.updateBidPrice(bidPrice, bidderId);
  }
  async startAuction(auctionId) {
    return AuctionGameLifecycle.launch(await this.createGameContext(auctionId));
  }
}
