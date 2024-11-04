import { Injectable } from '@nestjs/common';
import { AuctionGameContext } from './game.context';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { AuctionGameLifecycle } from './game.lifecycle';
import {
  InitialDataDto,
  LoadGameDataDto,
  ResponseDto,
  SaveGameDataDto,
} from '~/src/domain/game/dto/game.dto';
import { GameGateway } from '~/src/domain/game/game.gateway';

@Injectable()
export class GameService {
  constructor(
    private readonly auctionService: AuctionService,
    private readonly gameGateway: GameGateway,
  ) {}

  private auctionsMap: Map<string, AuctionGameContext> = new Map();

  /**
   * 경매 게임 컨텍스트 생성
   * @param auctionId
   * @returns Promise<AuctionGameContext>
   */
  private async createGameContext(auctionId: string) {
    const loadfun = async (
      auctionId: string,
      auctionContext: AuctionGameContext,
    ): Promise<LoadGameDataDto> => {
      //TODO: load data from db

      this.auctionsMap.set(auctionId, auctionContext);
      return new LoadGameDataDto();
    };

    const savefun = async (
      saveGameDataDto: SaveGameDataDto,
    ): Promise<boolean> => {
      //TODO: save data to dbgi
      console.log(saveGameDataDto);
      return true;
    };

    const initialDataDto: InitialDataDto = { id: auctionId };

    const auctionContext = new AuctionGameContext(
      loadfun,
      savefun,
      initialDataDto,
    );
    auctionContext.setSocketEvent((response: ResponseDto) => {
      return this.gameGateway.sendToGame(response);
    });
    return auctionContext;
  }

  /**
   * 현재 경매가 조회
   * @param auctionId
   * @returns
   */
  joinAuctionGiveCurrentBid(auctionId) {
    const auctionContext = this.auctionsMap.get(auctionId);
    return auctionContext.getCurrentBidItemInfo();
  }

  /**
   * 경매 입찰
   * @param updateBidPriceDto
   * @returns boolean
   */
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

  /**
   * 경매 시작
   * @param startAuctionDto
   * @returns Promise<boolean>
   */
  async startAuction(startAuctionDto: { auctionId: string }) {
    const { auctionId } = startAuctionDto;
    const auctionContext = await this.createGameContext(auctionId);
    AuctionGameLifecycle.launch(auctionContext);
  }
}
