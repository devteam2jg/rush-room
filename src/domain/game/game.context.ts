import {
  LoadGameDataDto,
  SaveGameDataDto,
  InitialDataDto,
  ResponseDto,
  MessageType,
  UpdateBidPriceDto,
} from '~/src/domain/game/dto/game.dto';
import { Socket } from 'socket.io';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';
export enum AuctionStatus {
  READY = 'READY',
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
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
}
export class AuctionGameContext {
  auctionId: string;
  bidItems: BidItem[];
  auctionStartDateTime: Date;
  auctionStatus: AuctionStatus;

  currentBidItem: BidItem;
  sequence: number;

  prevBidPrice: number;
  prevBidderId: string;

  joinedUsers: UserDataDto[];

  constructor(initialDataDto: InitialDataDto) {
    const { id } = initialDataDto;
    this.auctionId = id;

    this.currentBidItem = null;
    this.prevBidderId = null;
    this.prevBidPrice = 0;
    this.sequence = 0;
  }
  timerInterrupt() {
    return --this.currentBidItem.itemSellingLimitTime;
  }
  getTime(): number {
    return this.currentBidItem.itemSellingLimitTime;
  }
  setNextBidItem(): boolean {
    this.currentBidItem = this.bidItems[this.sequence];
    if (!this.currentBidItem) return false;
    this.sequence++;
    return true;
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

  async loadFromDB(): Promise<boolean> {
    const data: LoadGameDataDto = await this.loadEvent(this.auctionId, this);
    const { auctionId, bidItems, auctionStartDateTime } = data;
    this.auctionId = auctionId;
    this.bidItems = bidItems;
    this.auctionStartDateTime = auctionStartDateTime;
    data.callback();
    return true;
  }

  async saveToDB(): Promise<boolean> {
    const saveGameDataDto: SaveGameDataDto = {
      auctionId: this.auctionId,
      bidItems: this.bidItems,
      auctionStatus: this.auctionStatus,
    };
    const result: boolean = await this.saveEvent(saveGameDataDto);
    return result;
  }

  /** client event */
  updateBidPrice(
    socket: Socket,
    updateBidPriceDto: UpdateBidPriceDto,
  ): boolean {
    const { bidPrice, bidderId, bidderNickname } = updateBidPriceDto;
    console.log(updateBidPriceDto);
    console.log('currentTime', this.getTime());
    console.log('try to update bid price', bidPrice, bidderId);

    if (!this.currentBidItem.canBid) {
      console.log('bid is not allowed');
      return false;
    }
    if (bidPrice <= this.currentBidItem.bidPrice) {
      console.log('bid price is lower than current price');
      return false;
    }

    this.prevBidPrice = this.currentBidItem.bidPrice;
    this.prevBidderId = this.currentBidItem.bidderId;
    this.currentBidItem.bidPrice = bidPrice;
    this.currentBidItem.bidderId = bidderId;
    console.log('bid price is updated', bidPrice);

    this.updateEvent();

    this.sendToClient(null, MessageType.TIME_UPDATE, { time: this.getTime() });

    this.sendToClient(null, MessageType.PRICE_UPDATE, {
      bidderNickname,
      bidPrice: this.currentBidItem.bidPrice,
      bidderId: this.currentBidItem.bidderId,
    });

    this.sendToClient(socket, MessageType.NOTIFICATION, {
      message: '입찰이 완료되었습니다',
      bidPrice: this.currentBidItem.bidPrice,
    });
    return true;
  }

  /** socket function
   *
   * @param socket 소켓 이 null이면 모든 참여자에게 메세지를 보냄, 아니면 해당 소켓에만 메세지를 보냄
   * @param messageType
   * @param data
   *
   * 비동기로 동작함
   */
  sendToClient(socket, messageType: MessageType, data?: any) {
    return new Promise(() => {
      if (!data)
        data = {
          time: this.currentBidItem.itemSellingLimitTime,
          bidPrice: this.currentBidItem.bidPrice,
          bidderId: this.currentBidItem.bidderId,
        };
      const response: ResponseDto = {
        auctionId: this.auctionId,
        messageType,
        socket,
      };
      this.socketEvent(response, data);
    });
  }

  requestCurrentBidInfo() {
    return {
      itemId: this.currentBidItem.itemId,
      time: this.getTime(),
      bidPrice: this.currentBidItem.bidPrice,
      bidderId: this.currentBidItem.bidderId,
    };
  }

  notifyAuctionEnd() {
    this.sendToClient(null, MessageType.NOTIFICATION, {
      type: 'AUCTION_END',
      message: '경매가 종료되었습니다',
    });
  }
  /***************************************************************************
   * event listener list
   *
   ***************************************************************************/

  private socketEvent: (response: ResponseDto, data: any) => boolean = null;

  private loadEvent: (
    auctionId: string,
    auctionContext: AuctionGameContext,
  ) => Promise<LoadGameDataDto> = null;

  private saveEvent: (saveGameDataDto: SaveGameDataDto) => Promise<boolean> =
    null;

  private updateEvent: () => void = null;

  setLoadEventListener(
    event: (
      auctionId: string,
      auctionContext: AuctionGameContext,
    ) => Promise<LoadGameDataDto>,
  ): this {
    this.loadEvent = event;
    return this;
  }

  setSaveEventListener(
    event: (saveGameDataDto: SaveGameDataDto) => Promise<boolean>,
  ): this {
    this.saveEvent = event;
    return this;
  }

  setSocketEventListener(
    event: (response: ResponseDto, data: any) => boolean,
  ): this {
    this.socketEvent = event;
    return this;
  }

  setUpdateBidEventListener(event: () => void): this {
    this.updateEvent = event;
    return this;
  }
}
