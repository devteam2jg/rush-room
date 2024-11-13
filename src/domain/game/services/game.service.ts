import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  AuctionGameContext,
  AuctionStatus,
  BidItem,
} from '~/src/domain/game/context/game.context';
import {
  AuctionUserDataDto,
  BudgetHandler,
  LoadGameDataDto,
  MessageType,
  RequestDto,
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
import { GameStatusService } from '~/src/domain/game/services/game.status.service';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AuctionGameFactory } from '~/src/domain/game/lifecycle/game.lifecycle';
@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name, { timestamp: true });

  constructor(
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
    private readonly auctionRepository: AuctionRepository,
    private readonly auctionItemRepository: AuctionItemRepository,
    private readonly usersService: UsersService,
    private readonly gameStatusService: GameStatusService,
    private readonly auctionService: AuctionService,
    @InjectQueue('update-bid-queue')
    private readonly updateBidQueue: Queue,
    private readonly auctionGameFactory: AuctionGameFactory,
  ) {
    // this.updateBidQueue.setMaxListeners(20);
    // 생성자로 경매 타이머 실행
    this.intervalAuctionCheck();
  }

  /**
   * 경매
   */
  async joinAuction(
    socket: Socket,
    joinAuctionDto: JoinAuctionDto,
  ): Promise<void> {
    const { auctionId, userId } = joinAuctionDto;
    const auctionContext = this.gameStatusService.getRunningContext(auctionId);

    const budget = auctionContext.budget;
    const userData = await this.usersService.findById({ id: userId });
    const user: AuctionUserDataDto = {
      budget,
      bidPrice: 0,
      budgetHandler: new BudgetHandler(),
      ...userData,
    };
    auctionContext.join(user);
  }
  skip(auctionId: string) {
    const auctionContext = this.gameStatusService.getRunningContext(auctionId);
    auctionContext.skipBidItem();
  }

  /**
   * 경매 입찰
   * @param updateBidPriceDto
   * @returns boolean
   */

  async updateBidPrice(updateBidPriceDto: UpdateBidPriceDto): Promise<any> {
    try {
      //const serializedData = safeStringify(updateBidPriceDto);
      // 큐에 작업 추가, 완료 및 실패 시 자동 삭제
      console.log('요청updateBidPriceDto:', updateBidPriceDto);
      const job = await this.updateBidQueue.add(
        'updateBid',
        updateBidPriceDto,
        {
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      console.log('Job added:', job.id);
      const result = await job.finished();
      return result;
    } catch (err) {
      throw err;
    }
  }

  private createGameFunction(): LifecycleFuctionDto {
    return {
      jobBeforeRoomCreate: async (auctionContext: AuctionGameContext) => {
        const auctionId = auctionContext.auctionId;
        if (this.gameStatusService.isRunning(auctionId)) return false;
        auctionContext.loadContext(await this.load(auctionId));
        auctionContext.setSocketEventListener(this.socketfun);
        return true;
      },
      jobAfterRoomCreate: async (auctionContext: AuctionGameContext) => {
        const auctionId = auctionContext.auctionId;
        this.gameStatusService.deleteReady(auctionId);
        this.gameStatusService.setRunning(auctionId, auctionContext);
        return true;
      },
      jobBeforeRoomDestroy: async (auctionContext: AuctionGameContext) => {
        const auctionId = auctionContext.auctionId;
        this.gameStatusService.deleteRunning(auctionId);
        return true;
      },
      jobAfterRoomDestroy: async (auctionContext: AuctionGameContext) => {
        const { auctionId } = auctionContext;
        this.auctionService.update(auctionId, { status: Status.END }, {});
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
    if (this.gameStatusService.isRunningOrReady(auctionId)) {
      return {
        message: '이미 시작된 경매입니다',
      };
    }
    this.gameStatusService.setReady(auctionId);
    console.log('경매 시작', auctionId);
    const lifecycleDto = this.createGameFunction();
    return this.auctionGameFactory.launch(auctionId, lifecycleDto);
  }

  requestAuctionInfo(data: RequestDto) {
    const { auctionId } = data;
    const auctionContext = this.gameStatusService.getRunningContext(auctionId);
    return auctionContext.requestCurrentBidInfo(data);
  }

  requestLastNotifyData(data: RequestDto) {
    const { auctionId, socketId } = data;
    const auctionContext = this.gameStatusService.getRunningContext(auctionId);
    auctionContext.requestLastNotifyData(socketId);
  }
  requestCamera(data: RequestDto) {
    const { auctionId, userId, socketId } = data;
    const auctionContext = this.gameStatusService.getRunningContext(auctionId);
    if (auctionContext.isSeller(userId)) {
      auctionContext.sendToClient(socketId, MessageType.NOTIFICATION, {
        type: 'CAMERA_REQUEST',
        message: '카메라를 켜 주세요',
      });
    }
    return true;
  }
  requestOwnerInfo(data: RequestDto) {
    const { auctionId, userId } = data;
    const auctionContext = this.gameStatusService.getRunningContext(auctionId);
    return {
      isOwner: auctionContext.isOwner(userId),
    };
  }
  async intervalAuctionCheck() {
    await this.startAuctionTimers();
    setInterval(async () => {
      await this.startAuctionTimers();
    }, 600000);
  }

  async startAuctionTimers(): Promise<void> {
    const auctions = await this.auctionRepository.getWaitAuctions();
    for (const auction of auctions) {
      const now = new Date();
      const startTime = new Date(auction.eventDate);
      const timeDifference = startTime.getTime() - now.getTime();
      if (timeDifference <= 600000 && timeDifference > 0) {
        setTimeout(async () => {
          await this.startAuction({ auctionId: auction.id });
        }, timeDifference);
      } else if (timeDifference <= 0) {
        await this.startAuction({ auctionId: auction.id });
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
        itemSellingLimitTime: auction.sellingLimitTime * 60,
        title: item.title,
        description: item.description,
        picture: item.imageUrls,
        canBid: false,
        canBidAnonymous: item.isBidAccessableForAnon,
      };
    });

    const auctionStartDateTime = auction.eventDate;
    const auctionStatus = AuctionStatus.READY;

    const loadGameDataDto: LoadGameDataDto = {
      auctionId: auctionId,
      auctionTitle: auction.title,
      ownerId: auction.user.id,
      bidItems: bidItems,
      auctionStartDateTime: auctionStartDateTime,
      auctionStatus: auctionStatus,
      budget: auction.budget,
    };
    return loadGameDataDto;
  };

  async reduceTime(auctionId: string, userId: string, time: number) {
    const auctionContext = this.gameStatusService.getRunningContext(auctionId);
    return auctionContext.reduceTime(time);
  }
  // async terminateAuction(auctionId: string) {
  //   const auctionContext = this.gameStatusService.getRunningContext(auctionId);
  //   return auctionContext.terminate();
  // }

  private readonly socketfun = (response: ResponseDto, data: any) => {
    if (response.socketId) {
      return this.gameGateway.sendToOne(response, data);
    } else return this.gameGateway.sendToMany(response, data);
  };
  private readonly saveEach = (bidItem: BidItem) => {
    this.auctionItemRepository.updateAuctionItemMany([bidItem]);
  };
}
