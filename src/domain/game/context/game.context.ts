import {
  InitialDataDto,
  LoadGameDataDto,
  MessageType,
  ResponseDto,
  SaveGameDataDto,
  UpdateBidPriceDto,
  AuctionUserDataDto,
  RequestDto,
} from '~/src/domain/game/dto/game.dto';
import { LifecycleFuctionDto } from '~/src/domain/game/dto/lifecycle.dto';

export enum AuctionStatus {
  READY = 'READY',
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
  TERMINATED = 'TERMINATED',
}
export class BidItem {
  itemId: string;
  sellerId: string;
  bidderId: string;
  startPrice: number;
  bidPrice: number;
  itemSellingLimitTime: number;
  title: string;
  description: string;
  picture: string[];
  canBid: boolean; // 기본값은 false
  canBidAnonymous: boolean; // 기본값은 true
}
export class AuctionGameContext {
  auctionId: string;
  bidItems: BidItem[];
  auctionStartDateTime: Date;
  auctionStatus: AuctionStatus;
  auctionTitle: string;
  currentBidItem: BidItem;
  sequence: number;
  budget: number;
  ownerId: string;

  prevBidPrice: number;
  prevBidderId: string;
  prevSocketId: string;

  private readonly joinedUsers: Map<string, AuctionUserDataDto> = new Map();

  join(userData: AuctionUserDataDto) {
    const { id } = userData;
    if (this.joinedUsers.has(id)) return false;
    this.joinedUsers.set(id, userData);
    return true;
  }

  constructor(initialDataDto: InitialDataDto) {
    const { id } = initialDataDto;
    this.auctionId = id;

    this.currentBidItem = null;
    this.prevBidderId = null;
    this.prevBidPrice = 0;
    this.sequence = 0;
  }
  // -----------------------------------------------------------------------
  /*
    Auction Status 관리
   */
  isRunning(): boolean {
    return this.auctionStatus == AuctionStatus.ONGOING;
  }
  isOwner(userId: string): boolean {
    return this.ownerId == userId;
  }
  // terminate() {
  //   this.auctionStatus = AuctionStatus.TERMINATED;
  // }
  // -----------------------------------------------------------------------
  timerInterrupt() {
    return --this.currentBidItem.itemSellingLimitTime;
  }
  getTime(): number {
    return this.currentBidItem.itemSellingLimitTime;
  }
  getUsers(): AuctionUserDataDto[] {
    return Array.from(this.joinedUsers.values());
  }
  getUserData(userId: string): AuctionUserDataDto {
    return this.joinedUsers.get(userId);
  }
  setNextBidItem(): BidItem {
    this.currentBidItem = this.bidItems[this.sequence];
    if (!this.currentBidItem) return null;
    this.sequence++;
    return this.currentBidItem;
  }
  isAuctionEnded(): boolean {
    return this.sequence === this.bidItems.length;
  }
  subTime(time: number) {
    this.currentBidItem.itemSellingLimitTime -= time;
  }
  setTime(time: number) {
    this.currentBidItem.itemSellingLimitTime = time;
  }
  activateBid() {
    this.currentBidItem.canBid = true;
  }
  deactivateBid() {
    this.currentBidItem.canBid = false;
  }
  isBidActivated(): boolean {
    return this.currentBidItem.canBid;
  }
  isSeller(userId: string): boolean {
    console.log('판매자 인가요? ', userId, this.currentBidItem.sellerId);
    return this.currentBidItem.sellerId == userId;
  }
  async loadContext(data: LoadGameDataDto): Promise<boolean> {
    const { auctionId, bidItems, auctionStartDateTime, auctionTitle, budget } =
      data;
    this.auctionId = auctionId;
    this.auctionTitle = auctionTitle;
    this.bidItems = bidItems;
    this.auctionStartDateTime = auctionStartDateTime;
    this.budget = budget;
    this.ownerId = data.ownerId;
    return true;
  }

  getGameData(): SaveGameDataDto {
    const saveGameDataDto: SaveGameDataDto = {
      auctionId: this.auctionId,
      bidItems: this.bidItems,
      auctionStatus: this.auctionStatus,
    };
    return saveGameDataDto;
  }

  // isTerminated(): boolean {
  //   return this.auctionStatus == AuctionStatus.TERMINATED;
  // }
  skipBidItem() {
    this.currentBidItem.canBid = false;
    this.setTime(8);
  }
  /** client event */
  updateBidPrice(updateBidPriceDto: UpdateBidPriceDto): any {
    const { bidPrice, bidderId, bidderNickname, socketId } = updateBidPriceDto;

    if (!this.currentBidItem.canBid) {
      this.sendToClient(socketId, MessageType.ALERT, {
        type: 'RED',
        message: '입찰이 불가능한 상태입니다',
      });
      return {
        message: '입찰이 불가능한 상태입니다',
      };
    }

    if (bidPrice <= this.currentBidItem.bidPrice) {
      this.sendToClient(socketId, MessageType.ALERT, {
        type: 'RED',
        message: '더 높은 가격을 입력해주세요',
      });
      return {
        status: 'fail',
        bidPrice: this.currentBidItem,
      };
    }

    const user: AuctionUserDataDto = this.joinedUsers.get(bidderId);
    console.log('user', user);
    if (user.budget < bidPrice) {
      this.sendToClient(socketId, MessageType.ALERT, {
        type: 'RED',
        message: '예산이 부족합니다.',
      });
      return {
        status: 'fail',
      };
    }
    user.bidPrice = bidPrice;
    user.budget -= bidPrice;
    this.prevBidPrice = this.currentBidItem.bidPrice;
    this.prevBidderId = this.currentBidItem.bidderId;
    this.currentBidItem.bidPrice = bidPrice;
    this.currentBidItem.bidderId = bidderId;
    this.updateEvent(updateBidPriceDto);

    if (this.prevSocketId && this.prevSocketId != socketId) {
      this.sendToClient(this.prevSocketId, MessageType.ALERT, {
        type: 'YELLOW',
        message: '다른 사용자가 입찰을 하였습니다',
      });
    }
    this.prevSocketId = socketId;

    this.sendToClient(socketId, MessageType.ALERT, {
      type: 'GREEN',
      message: '입찰이 완료되었습니다',
    });

    this.sendToClient(null, MessageType.TIME_UPDATE, { time: this.getTime() });
    this.sendToClient(null, MessageType.PRICE_UPDATE, {
      bidderNickname,
      bidPrice: this.currentBidItem.bidPrice,
      bidderId: this.currentBidItem.bidderId,
    });

    return {
      status: 'success',
      bidPrice: this.currentBidItem.bidPrice,
      buget: user.budget,
    };
  }

  reduceTime(time: number) {
    if (this.currentBidItem.itemSellingLimitTime <= time) return;
    this.subTime(time);
    this.sendToClient(null, MessageType.TIME_UPDATE, { time: this.getTime() });
  }

  getUserDataById(userId: string): AuctionUserDataDto {
    return this.joinedUsers.get(userId);
  }
  /** socket function
   *
   * @param socket 소켓 이 null이면 모든 참여자에게 메세지를 보냄, 아니면 해당 소켓에만 메세지를 보냄
   * @param messageType
   * @param data
   *
   * 비동기로 동작함
   */
  sendToClient(socketId: string, messageType: MessageType, data?: any) {
    return new Promise(() => {
      if (!data)
        data = {
          itemId: this.currentBidItem.itemId,
          time: this.currentBidItem.itemSellingLimitTime,
          bidPrice: this.currentBidItem.bidPrice,
          bidderId: this.currentBidItem.bidderId,
        };
      const response: ResponseDto = {
        auctionId: this.auctionId,
        messageType,
        socketId,
      };
      this.socketEvent(response, data);
    });
  }

  requestCurrentBidInfo(data: RequestDto) {
    const user: AuctionUserDataDto = this.joinedUsers.get(data.userId);
    return {
      itemId: this.currentBidItem.itemId,
      time: this.getTime(),
      bidPrice: this.currentBidItem.bidPrice,
      bidderId: this.currentBidItem.bidderId,
      budget: user.budget,
      Anon: this.currentBidItem.canBidAnonymous,
    };
  }
  private lastNotifyData: any = null;
  notifyToClient(data: any) {
    this.lastNotifyData = data;
    this.sendToClient(null, MessageType.NOTIFICATION, data);
  }
  alertToClient(message: any) {
    this.sendToClient(null, MessageType.ALERT, message);
  }
  requestLastNotifyData(socketId) {
    this.sendToClient(socketId, MessageType.NOTIFICATION, this.lastNotifyData);
  }

  /***************************************************************************
   * event listener list
   *
   ***************************************************************************/

  private socketEvent: (response: ResponseDto, data: any) => boolean = null;

  private updateEvent: (updateDto: UpdateBidPriceDto) => void = null;

  private lifeCycleFunctionDto: LifecycleFuctionDto = null;

  setSocketEventListener(
    event: (response: ResponseDto, data: any) => boolean,
  ): this {
    this.socketEvent = event;
    return this;
  }

  setUpdateBidEventListener(
    event: (updateDto: UpdateBidPriceDto) => void,
  ): this {
    this.updateEvent = event;
    return this;
  }
  setLifeCycleFunctionDto(lifeCycleFunctionDto: LifecycleFuctionDto): this {
    this.lifeCycleFunctionDto = lifeCycleFunctionDto;
    return this;
  }
  getLifeCycleFunctionDto(): LifecycleFuctionDto {
    return this.lifeCycleFunctionDto;
  }
}
