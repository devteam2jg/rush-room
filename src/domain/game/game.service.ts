import { Injectable, Inject, forwardRef } from '@nestjs/common';
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
import { AuctionItemRepository } from '~/src/domain/auction/auction-item.repository';
@Injectable()
export class GameService {
  constructor(
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
    private readonly auctionRepository: AuctionRepository,
    private readonly auctionItemRepository: AuctionItemRepository,
  ) {}

  private auctionsMap: Map<string, AuctionGameContext> = new Map();

  isRunning(auctionId: string): boolean {
    return this.auctionsMap.has(auctionId);
  }
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

      const bidItems: BidItem[] = (
        await this.auctionItemRepository.getAuctionItemsByAuctionIdAndItemId(
          auctionId,
          null,
        )
      ).map((item) => {
        return {
          itemId: item.id,
          sellerId: item.user.id,
          bidderId: null,
          startPrice: item.startPrice,
          bidPrice: 0,
          itemSellingLimitTime: auction.sellingLimitTime * 4,
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
      const { bidItems } = saveGameDataDto;
      await this.auctionItemRepository.updateAuctionItemMany(bidItems);
      //if (saveResult === null) return false;
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
   * 경매 게임 로드
   * @param auctionId
   * @param socket
   */
  // async loadGame(auctionId: string, socket: any) {
  //   const auctionContext = this.auctionsMap.get(auctionId);
  // }

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
