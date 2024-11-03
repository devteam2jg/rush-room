import { Injectable } from '@nestjs/common';
import { AuctionGameContext, BidItem } from './game.context';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { AuctionGameLifecycle } from './game.lifecycle';
import {
  LoadGameDataDto,
  SaveGameDataDto,
} from '~/src/domain/game/dto/game.dto';

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
    this.auctionService.getAuctionDetail(auctionId, auctionitemId);
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

    const loadfun = async () => {
      return new LoadGameDataDto();
    };
    const savefun = async () => {
      return new SaveGameDataDto();
    };
    // DB에서 불러오는 로직

    const auctionGameContext = new AuctionGameContext(loadfun, savefun);
    this.auctionsMap.set(auctionId, auctionGameContext);
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
  updateBidPrice(updateBidPriceDto: {
    auctionId: string;
    bidPrice: number;
    bidderId: string;
  }): boolean {
    const { auctionId, bidPrice, bidderId } = updateBidPriceDto;
    const auctionContext = this.auctionsMap.get(auctionId);
    if (!auctionContext) {
      throw new Error('Auction not found');
    }
    return auctionContext.updateBidPrice(bidPrice, bidderId);
  }

  async startAuction(startAuctionDto: { auctionId: string }) {
    const { auctionId } = startAuctionDto;
    const auctionContext = await this.createGameContext(auctionId);
    return AuctionGameLifecycle.launch(auctionContext);
  }
}
