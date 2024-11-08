import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  AuctionGameContext,
  AuctionStatus,
  BidItem,
} from '~/src/domain/game/context/game.context';
import {
  LoadGameDataDto,
  ResponseDto,
  UpdateBidPriceDto,
} from '~/src/domain/game/dto/game.dto';
import { LifecycleFuctionDto } from '~/src/domain/game/dto/lifecycle.dto';
import { GameGateway } from '~/src/domain/game/game.gateway';
import { AuctionRepository } from '~/src/domain/auction/auction.repository';
import { AuctionItemRepository } from '~/src/domain/auction/auction-item.repository';
import { UsersService } from '~/src/domain/users/users.service';
import { Status } from '~/src/domain/auction/entities/auction.entity';
import { Socket } from 'socket.io';
import { GameStarter } from '~/src/domain/game/lifecycle/game.builder';
import { JoinAuctionDto } from '~/src/domain/game/dto/join.auction.dto';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name, { timestamp: true });

  private readonly auctionsMap: Map<string, AuctionGameContext> = new Map();
  private readonly auctionsForReady: Map<string, string> = new Map();

  constructor(
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
    private readonly auctionRepository: AuctionRepository,
    private readonly auctionItemRepository: AuctionItemRepository,
    private readonly usersService: UsersService,
  ) {
    // 생성자로 경매 타이머 실행
    this.intervalAuctionCheck();
  }
  getRunningContext(auctionId: string): AuctionGameContext {
    return this.auctionsMap.get(auctionId);
  }
  isRunning(auctionId: string): boolean {
    return this.auctionsMap.has(auctionId);
  }
  setRunning(auctionId: string, auctionContext: AuctionGameContext) {
    this.auctionsMap.set(auctionId, auctionContext);
  }
  setReady(auctionId: string) {
    this.auctionsForReady.set(auctionId, auctionId);
  }
  isRunningOrReady(auctionId: string): boolean {
    return this.isRunning(auctionId) || this.auctionsForReady.has(auctionId);
  }
  deleteReady(auctionId: string) {
    this.auctionsForReady.delete(auctionId);
  }
  deleteRunning(auctionId: string) {
    this.auctionsMap.delete(auctionId);
  }

  /**
   * 경매
   */
  async joinAuction(joinAuctionDto: JoinAuctionDto): Promise<void> {
    const { auctionId, userId } = joinAuctionDto;
    const auctionContext = this.auctionsMap.get(auctionId);
    const user = await this.usersService.findById({ id: userId });
    console.log('joinAuction', auctionId, userId);
    auctionContext.join(user);
  }

  /**ㄴ
   * 경매 입찰
   * @param updateBidPriceDto
   * @returns boolean
   */
  updateBidPrice(updateBidPriceDto: UpdateBidPriceDto): any {
    const { auctionId } = updateBidPriceDto;
    const auctionContext = this.auctionsMap.get(auctionId);
    return auctionContext.updateBidPrice(updateBidPriceDto);
  }

  private createGameFunction(): LifecycleFuctionDto {
    return {
      jobBeforeRoomCreate: async (auctionContext: AuctionGameContext) => {
        const auctionId = auctionContext.auctionId;
        if (this.isRunning(auctionId)) return false;
        auctionContext.loadGameData(await this.load(auctionId));
        auctionContext.setSocketEventListener(this.socketfun);
        return true;
      },
      jobAfterRoomCreate: async (auctionContext: AuctionGameContext) => {
        const auctionId = auctionContext.auctionId;
        this.deleteReady(auctionId);
        this.setRunning(auctionId, auctionContext);
        return true;
      },
      jobAfterRoomDestroy: async (auctionContext: AuctionGameContext) => {
        const auctionId = auctionContext.auctionId;
        this.deleteRunning(auctionId);
        return true;
      },
      jobAfterBidEnd: async (auctionContext: AuctionGameContext) => {
        const bidItem = auctionContext.currentBidItem;
        this.saveEach(bidItem);
        return true;
      },
    };
  }

  /**
   * 경매 시작
   * @param startAuctionDto
   * @returns Promise<boolean>
   */
  async startAuction(startAuctionDto: {
    auctionId: string;
  }): Promise<{ message: string }> {
    const { auctionId } = startAuctionDto;

    // 경매 시작 하면 상태 진행으로 변경
    this.auctionRepository.update(auctionId, { status: Status.PROGRESS });
    if (this.isRunningOrReady(auctionId)) {
      console.log('이미 시작된 경매입니다');
      return {
        message: '이미 시작된 경매입니다',
      };
    }
    this.setReady(auctionId);
    console.log('경매 시작', auctionId);
    GameStarter.launch(auctionId, this.createGameFunction());
    return {
      message: 'success',
    };
  }

  requestAuctionInfo(socket: Socket, auctionId: string) {
    const auctionContext = this.auctionsMap.get(auctionId);
    auctionContext.requestLastNotifyData(socket);
    return auctionContext.requestCurrentBidInfo();
  }

  async intervalAuctionCheck() {
    // 첫 실행에서 경매 놓치지 않도록 타이머 설정
    await this.startAuctionTimers();
    // 10분마다 타이머 설정
    setInterval(async () => {
      await this.startAuctionTimers();
    }, 600000); // 600000밀리초 = 10분
  }

  // 경매 시작 타이머 설정
  async startAuctionTimers(): Promise<void> {
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
      } else if (timeDifference <= 0) {
        await this.startAuction({ auctionId: auction.id }); // 이미 시작 시간이 지난 경매는 즉시 시작
      }
    }
  }

  private readonly load = async (
    auctionId: string,
  ): Promise<LoadGameDataDto> => {
    const auction = await this.auctionRepository.findOneBy({ id: auctionId });
    if (!auction) throw new Error('not found auction');
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
        bidPrice: item.startPrice,
        itemSellingLimitTime: auction.sellingLimitTime * 4,
        title: item.title,
        description: item.description,
        picture: item.imageUrls,
        canBid: false,
      };
    });

    const auctionStartDateTime = auction.eventDate;
    const auctionStatus = AuctionStatus.READY;

    const loadGameDataDto: LoadGameDataDto = {
      auctionId: auctionId,
      auctionTitle: auction.title,
      bidItems: bidItems,
      auctionStartDateTime: auctionStartDateTime,
      auctionStatus: auctionStatus,
    };
    return loadGameDataDto;
  };

  private readonly socketfun = (response: ResponseDto, data: any) => {
    return this.gameGateway.sendToMany(response, data);
  };
  private readonly saveEach = async (bidItem: BidItem): Promise<boolean> => {
    return await this.auctionItemRepository.updateAuctionItemMany([bidItem]);
  };
}
