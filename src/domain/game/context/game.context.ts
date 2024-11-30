import { BidMutex } from '~/src/domain/game/context/game.lock';
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
  bidder: AuctionUserDataDto;

  isSold: boolean;
  buyerId: string;

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
  private readonly mutex: BidMutex = new BidMutex();
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
  async timerInterrupt() {
    try {
      await this.mutex.lock();
      --this.currentBidItem.itemSellingLimitTime;
    } finally {
      this.mutex.unlock();
    }
  }
  async getTime(): Promise<number> {
    let time = 0;
    try {
      await this.mutex.lock();
      time = this.currentBidItem.itemSellingLimitTime;
    } finally {
      this.mutex.unlock();
    }
    return time;
  }
  getUsers(): AuctionUserDataDto[] {
    return Array.from(this.joinedUsers.values());
  }
  getUserData(userId: string): AuctionUserDataDto {
    return this.joinedUsers.get(userId);
  }
  resetUsersBidPrice() {
    this.joinedUsers.forEach((user) => {
      user.bidPrice = 0;
    });
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
    try {
      this.currentBidItem.itemSellingLimitTime -= time;
    } finally {
      this.mutex.unlock();
    }
  }
  async setTime(time: number) {
    try {
      await this.mutex.lock();
      this.currentBidItem.itemSellingLimitTime = time;
    } finally {
      this.mutex.unlock();
    }
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
  terminate() {
    this.auctionStatus = AuctionStatus.TERMINATED;
  }
  isTerminated(): boolean {
    return this.auctionStatus == AuctionStatus.TERMINATED;
  }
  skipBidItem() {
    this.currentBidItem.canBid = false;
    this.setTime(8);
  }
  private updateEvent: (
    updateData: UpdateBidPriceDto,
    context: AuctionGameContext,
  ) => void = null;

  private timeEvent: (updateData: UpdateBidPriceDto) => void = null;

  setTimeEventListener(event: (updateData: UpdateBidPriceDto) => void): this {
    this.timeEvent = event;
    return this;
  }
  /** client event */
  async updateBidPrice(updateBidPriceDto: UpdateBidPriceDto): Promise<any> {
    let result = null;
    try {
      await this.mutex.lock();
      result = this.updateEvent(updateBidPriceDto, this);
      this.timeEvent(updateBidPriceDto);
    } finally {
      this.mutex.unlock();
    }
    return result;
  }

  async reduceTime(time: number) {
    try {
      await this.mutex.lock();
      if (this.currentBidItem.itemSellingLimitTime <= time) return;
      this.subTime(time);
      this.sendToClient(null, MessageType.TIME_UPDATE, {
        time: this.getTime(),
      });
    } finally {
      this.mutex.unlock();
    }
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
      budget: user ? user.budget : null,
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

  private lifeCycleFunctionDto: LifecycleFuctionDto = null;

  setSocketEventListener(
    event: (response: ResponseDto, data: any) => boolean,
  ): this {
    this.socketEvent = event;
    return this;
  }

  setUpdateBidEventListener(
    event: (updateDto: UpdateBidPriceDto, context: AuctionGameContext) => void,
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

  getResults(): any[] {
    const result = this.bidItems.map((item) => {
      return {
        title: item.title,
        bidPrice: item.bidPrice,
        bidder: {
          name: item.bidder ? item.bidder.name : '익명',
          profileUrl: item.bidder ? item.bidder.profileUrl : null,
        },
        picture: item.picture[0],
      };
    });
    return result;
  }
}
