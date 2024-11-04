import { Injectable } from '@nestjs/common';
import { AuctionGameContext, AuctionStatus } from './game.context';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { AuctionGameLifecycle } from './game.lifecycle';
import {
  InitialDataDto,
  LoadGameDataDto,
  ResponseDto,
  SaveGameDataDto,
  UpdateBidPriceDto,
} from '~/src/domain/game/dto/game.dto';
import { GameGateway } from '~/src/domain/game/game.gateway';
import { AuctionRepository } from '~/src/domain/auction/auction.repository';
import { AuctionItemRepository } from '~/src/domain/auction/auction-item.repository';

@Injectable()
export class GameService {
  constructor(
    private readonly auctionService: AuctionService,
    private readonly gameGateway: GameGateway,
    private readonly auctionRepository: AuctionRepository,
    private readonly auctionItemRepository: AuctionItemRepository,
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

      const auction = await this.auctionRepository.findOneBy({ id: auctionId });
      const auctionItems = auction.auctionItems;

      auctionContext.bidItems = auctionItems.map((item) => {
        return {
          itemId: item.id,
          sellerId: item.user.id,
          bidderId: null,
          startPrice: item.startPrice,
          bidPrice: 0,
          itemSellingLimitTime: auction.sellingLimitTime,
          title: item.title,
          description: item.description,
          picture: item.imageUrls,
          canBid: false,
        };
      });
      auctionContext.auctionStartDateTime = auction.eventDate;
      auctionContext.auctionStatus = AuctionStatus.READY;
      auctionContext.currentBidItem = auctionContext.bidItems[0];
      auctionContext.prevBidderId = null;
      auctionContext.prevBidPrice = 0;

      this.auctionsMap.set(auctionId, auctionContext);
      return new LoadGameDataDto();
    };

    const savefun = async (
      saveGameDataDto: SaveGameDataDto,
    ): Promise<boolean> => {
      //TODO: save data to db
      const saveRResult = await this.auctionRepository.save({
        id: saveGameDataDto.auctionId,
        bidItems: saveGameDataDto.bidItems,
        auctionStatus: saveGameDataDto.auctionStatus,
      });

      console.log(saveRResult);
      return true;
    };
    const socketfun = (response: ResponseDto) => {
      return this.gameGateway.sendToGame(response);
    };

    const initialDataDto: InitialDataDto = { id: auctionId };

    const auctionContext = new AuctionGameContext(initialDataDto)
      .setLoadEventListener(loadfun)
      .setSaveEventListener(savefun)
      .setSocketEventListener(socketfun);

    return auctionContext;
  }

  /**
   * 현재 경매가 조회
   * @param auctionId
   * @returns
   */
  getCurrentBidInfo({ auctionId }) {
    const auctionContext = this.auctionsMap.get(auctionId);
    return auctionContext.getCurrentBidItemInfo();
  }

  /**
   * 경매 입찰
   * @param UpdateBidPriceDto
   * @returns boolean
   */
  updateBidPrice(updateBidPriceDto: UpdateBidPriceDto): boolean {
    const { auctionId } = updateBidPriceDto;
    const auctionContext = this.auctionsMap.get(auctionId);
    return auctionContext.updateBidPrice(updateBidPriceDto);
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
