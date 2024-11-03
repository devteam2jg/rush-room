import { Injectable } from '@nestjs/common';
import { AuctionGameContext } from './game.context';
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
    const loadfun = async (auctionId: string) => {
      return new LoadGameDataDto();
    };
    const savefun = async (saveGameDataDto: SaveGameDataDto) => {
      console.log(saveGameDataDto);
    };

    const auctionGameContext = new AuctionGameContext(loadfun, savefun, {
      id: auctionId,
    });
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
