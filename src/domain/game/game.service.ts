import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  AuctionGameContext,
  AuctionStatus,
  BidItem,
} from '~/src/domain/game/context/game.context';
import {
  LoadGameDataDto,
  ResponseDto,
  SaveGameDataDto,
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
import { UserDataDto } from '~/src/domain/users/dto/user.dto';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { RoomService } from '~/src/domain/game/room-service/room.service';
import { TransportService } from '~/src/domain/game/mediasoup/transport/transport.service';
import { JoinAuctionDto } from '~/src/domain/game/dto/join.auction.dto';
import { JoinAuctionResultDto } from '~/src/domain/game/dto/join.auction.result.dto';
import { ProduceDto } from '~/src/domain/game/dto/produce.dto';
import { ProducerConsumerService } from '~/src/domain/game/mediasoup/producer-consumer/producer-consumer.service';
import { ConsumerDto } from '~/src/domain/game/dto/consumer.dto';
import { ConnectTransportDto } from '~/src/domain/game/dto/connect.transport.dto';

@Injectable()
export class GameService {
  private readonly transportService: TransportService;
  private readonly producerConsumerService: ProducerConsumerService;
  private logger = new Logger(GameService.name, { timestamp: true });

  private readonly auctionsMap: Map<string, AuctionGameContext> = new Map();
  private readonly auctionsForReady: Map<string, string> = new Map();

  constructor(
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
    private readonly auctionService: AuctionService,
    private readonly auctionRepository: AuctionRepository,
    private readonly auctionItemRepository: AuctionItemRepository,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,
  ) {
    // 생성자로 경매 타이머 실행
    this.intervalAuctionCheck();
    this.transportService = new TransportService(this.roomService);
    this.producerConsumerService = new ProducerConsumerService(
      this.roomService,
    );
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
  async joinAuction(
    joinAuctionDto: JoinAuctionDto,
    socket: Socket,
  ): Promise<JoinAuctionResultDto> {
    const { auctionId, userId } = joinAuctionDto;
    const peerId = socket.id;
    const auctionContext = this.auctionsMap.get(auctionId);
    const user = await this.usersService.findById({ id: userId });
    auctionContext.join(user, socket);

    const room = auctionContext.room;
    const sendTransportOptions =
      await this.transportService.createWebRtcTransport(
        auctionId,
        peerId,
        'send',
      );

    const recvTransportOptions =
      await this.transportService.createWebRtcTransport(
        auctionId,
        peerId,
        'recv',
      );
    // 방의 현재 참여자 목록 전송
    const peerIds = Array.from(room.peers.keys());

    // TODO: 방송 중인 한명의 정보만 전달. 기존 Producer들의 정보 수집
    const existingProducers = [];
    for (const [otherPeerId, peer] of room.peers) {
      if (otherPeerId !== peerId) {
        for (const producer of peer.producers.values()) {
          existingProducers.push({
            producerId: producer.producer.id,
            peerId: otherPeerId,
            kind: producer.producer.kind,
          });
        }
      }
    }
    return {
      sendTransportOptions,
      recvTransportOptions,
      rtpCapabilities: room.router.router.rtpCapabilities,
      peerIds,
      existingProducers,
    };
  }

  getRoom(auctionId: string) {
    const auctionContext = this.auctionsMap.get(auctionId);
    return auctionContext.room;
  }

  async createServerTransport(
    connectTransportDto: ConnectTransportDto,
    socket: Socket,
  ) {
    return this.transportService.connectTransport(connectTransportDto, socket);
  }

  async createServerProducer(produceDto: ProduceDto, socket: Socket) {
    const { auctionId, kind, transportId, rtpParameters } = produceDto;
    const peerId = socket.id;
    const producerId = await this.producerConsumerService.createProducer({
      auctionId,
      peerId,
      transportId,
      kind,
      rtpParameters,
    });
    this.logger.debug(`New producer created: ${producerId}`);
    const auctionContext = this.auctionsMap.get(auctionId);
    auctionContext.notifyToClient({
      type: 'NEW_PRODUCER',
      producerId,
      peerId,
      kind,
    });
    return { producerId };
  }

  async createServerConsumer(consumeDto: ConsumerDto, socket: Socket) {
    const { auctionId, producerId, rtpCapabilities, transportId } = consumeDto;
    const peerId = socket.id;
    const consumerData = await this.producerConsumerService.createConsumer({
      auctionId,
      peerId,
      transportId,
      producerId,
      rtpCapabilities,
    });
    this.logger.log(
      `New consumer created and consuming producerId: ${consumerData.producerId}`,
    );
    return { consumerData };
  }

  async stopSellerProducer(data) {
    const { auctionId } = data;
    this.logger.log(`stopSellerProducer: ${auctionId}`);
    return this.producerConsumerService.stopSellerPeer({
      auctionId,
    });
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

  private createGameFunction(auctionId: string): LifecycleFuctionDto {
    return {
      auctionId,
      saveEvent: this.save,
      loadEvent: this.load,
      socketEvent: this.socketfun,

      jobBeforeRoomCreate: async (auctionContext: AuctionGameContext) => {
        const auctionId = auctionContext.auctionId;
        if (this.isRunning(auctionId)) return false;
        return true;
      },
      jobAfterRoomCreate: async (auctionContext: AuctionGameContext) => {
        const auctionId = auctionContext.auctionId;
        auctionContext.room = await this.roomService.createRoom(auctionId);
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
    const lifecycleDto = this.createGameFunction(auctionId);
    return GameStarter.launch(lifecycleDto);
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

  private readonly save = async (
    saveGameDataDto: SaveGameDataDto,
  ): Promise<boolean> => {
    const { bidItems } = saveGameDataDto;
    await this.auctionItemRepository.updateAuctionItemMany(bidItems);
    return true;
  };
  private readonly socketfun = (response: ResponseDto, data: any) => {
    return this.gameGateway.sendToMany(response, data);
  };
  private readonly saveEach = async (bidItem: BidItem): Promise<boolean> => {
    return new Promise(async (resolve) => {
      await this.auctionItemRepository.updateAuctionItemMany([bidItem]);
      resolve(true);
    });
  };
}
