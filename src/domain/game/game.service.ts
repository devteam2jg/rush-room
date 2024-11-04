import { Injectable } from '@nestjs/common';
import { AuctionGameContext, AuctionStatus, BidItem } from './game.context';

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

@Injectable()
export class GameService {
  constructor(
    private readonly gameGateway: GameGateway,
    private readonly auctionRepository: AuctionRepository,
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
      const bidItems: BidItem[] = auction.auctionItems.map((item) => {
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
      const auctionStartDateTime = auction.eventDate;
      const auctionStatus = AuctionStatus.READY;
      const callback = () => this.auctionsMap.set(auctionId, auctionContext);

      const loadGameDataDto: LoadGameDataDto = {
        auctionId: auctionId,
        bidItems: bidItems,
        auctionStartDateTime: auctionStartDateTime,
        auctionStatus: auctionStatus,
        callback: callback,
      };

      return loadGameDataDto;
    };

    const savefun = async (
      saveGameDataDto: SaveGameDataDto,
    ): Promise<boolean> => {
      const saveResult = await this.auctionRepository.update(
        { id: saveGameDataDto.auctionId },
        {
          auctionItems: saveGameDataDto.bidItems.map((item) => {
            return {
              id: item.itemId,
              startPrice: item.startPrice,
              bidPrice: item.bidPrice,
              user: { id: item.sellerId },
              title: item.title,
              description: item.description,
              imageUrls: item.picture,
            };
          }),
        },
      );
      //if (saveResult === null) return false;
      console.log(saveResult);
      return true;
    };

    const socketfun = (response: ResponseDto, data: any) => {
      return this.gameGateway.sendToMany(response, data);
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
