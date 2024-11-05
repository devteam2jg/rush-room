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
import { Socket } from 'socket.io';
import { UsersService } from '~/src/domain/users/users.service';
import { Status } from '~/src/domain/auction/entities/auction.entity';

@Injectable()
export class GameService {
  constructor(
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
    private readonly auctionRepository: AuctionRepository,
    private readonly auctionItemRepository: AuctionItemRepository,
    private readonly usersService: UsersService,
  ) {
    // 생성자로 실행하는거 맞나??
    this.setAuctionStartTimers();
  }

  private readonly auctionsMap: Map<string, AuctionGameContext> = new Map();

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
      const joinedUsers = auction.joinedUsers;
      const callback = () => this.auctionsMap.set(auctionId, auctionContext);

      const loadGameDataDto: LoadGameDataDto = {
        auctionId: auctionId,
        auctionTitle: auction.title,
        bidItems: bidItems,
        auctionStartDateTime: auctionStartDateTime,
        auctionStatus: auctionStatus,
        joinedUsers: joinedUsers,
        callback: callback,
      };
      return loadGameDataDto;
    };

    const savefun = async (
      saveGameDataDto: SaveGameDataDto,
    ): Promise<boolean> => {
      const { bidItems, joinedUsers } = saveGameDataDto;
      await this.auctionItemRepository.updateAuctionItemMany(bidItems);
      await this.auctionRepository.updateJoinedUsers(auctionId, joinedUsers);
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
   * 경매
   */
  async joinAuction(auctionId: string, userId: string) {
    const auctionContext = this.auctionsMap.get(auctionId);
    const user = await this.usersService.findById({ id: userId });
    auctionContext.joinedUsers.push(user);
  }
  /**
   * 경매 입찰
   * @param UpdateBidPriceDto
   * @returns boolean
   */
  updateBidPrice(updateBidPriceDto: UpdateBidPriceDto): any {
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
    // 경매 시작 하면 상태 진행으로 변경
    await this.auctionRepository.update(auctionId, { status: Status.PROGRESS });
    return AuctionGameLifecycle.launch(auctionContext);
  }

  requestAuctionInfo(auctionId: string) {
    const auctionContext = this.auctionsMap.get(auctionId);
    return auctionContext.requestCurrentBidInfo();
  }

  // 경매 시작 타이머 설정
  async setAuctionStartTimers(): Promise<void> {
    const auctions = await this.auctionRepository.getWaitAuctions(); // 조건에 맞는 경매 조회

    for (const auction of auctions) {
      const now = new Date();
      const startTime = new Date(auction.eventDate); // 경매 시작 시간, string으로 받아오기 때문에 Date로 변환

      const timeDifference = startTime.getTime() - now.getTime(); // 시작 시간과 현재 시간 차이 (ms)

      // 10분(600000ms) 이하일 때만 타이머 설정
      if (timeDifference <= 600000 && timeDifference > 0) {
        setTimeout(async () => {
          await this.startAuction({ auctionId: auction.id }); // 경매 시작 함수 호출
        }, timeDifference);
      }
    }
  }
}
