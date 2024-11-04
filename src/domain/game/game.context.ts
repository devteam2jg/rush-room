import {
  LoadGameDataDto,
  SaveGameDataDto,
  InitialDataDto,
  ResponseDto,
  MessageType,
  UpdateBidPriceDto,
} from '~/src/domain/game/dto/game.dto';

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

  constructor(initialDataDto: InitialDataDto) {
    const { id } = initialDataDto;
    this.auctionId = id;

    this.currentBidItem = null;
    this.prevBidderId = null;
    this.prevBidPrice = 0;
    this.sequence = 0;
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
  setTime(time: number) {
    this.currentBidItem.itemSellingLimitTime = time;
  }
  activateBid() {
    this.currentBidItem.canBid = true;
  }
  deactivateBid() {
    this.currentBidItem.canBid = false;
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
  // -----------------------------------------------------------------------------
  /** client event */

  getCurrentBidItemInfo() {
    return {
      time: this.currentBidItem.itemSellingLimitTime,
      price: this.currentBidItem.bidPrice,
      bidderId: this.currentBidItem.bidderId,
    };
  }

  /** client event */
  updateBidPrice(updateBidPriceDto: UpdateBidPriceDto): boolean {
    const { bidPrice, bidderId, socket } = updateBidPriceDto;
    if (!this.currentBidItem.canBid) return false;
    if (bidPrice <= this.currentBidItem.bidPrice) return false;
    this.prevBidPrice = this.currentBidItem.bidPrice;
    this.prevBidderId = this.currentBidItem.bidderId;
    this.currentBidItem.bidPrice = bidPrice;
    this.currentBidItem.bidderId = bidderId;
    this.updateEvent();
    this.sendToClient(socket, MessageType.PRICE_UPDATE);
    return true;
  }

  sendToClient(socket, messageType: MessageType) {
    switch (messageType) {
      case MessageType.PRICE_UPDATE:
        const response: ResponseDto = {
          auctionId: this.auctionId,
          messageType,
          socket,
        };
        const data: any = {
          time: this.currentBidItem.itemSellingLimitTime,
          bidPrice: this.currentBidItem.bidPrice,
          bidderId: this.currentBidItem.bidderId,
        };
        this.socketEvent(response, data);
        break;
      case MessageType.NOTIFICATION:
      case MessageType.USER_MESSAGE:
      default:
        break;
    }
  }

  /**
   * event listener list
   */

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
  ): AuctionGameContext {
    this.loadEvent = event;
    return this;
  }

  setSaveEventListener(
    event: (saveGameDataDto: SaveGameDataDto) => Promise<boolean>,
  ): AuctionGameContext {
    this.saveEvent = event;
    return this;
  }

  setSocketEventListener(
    event: (response: ResponseDto, data: any) => boolean,
  ): AuctionGameContext {
    this.socketEvent = event;
    return this;
  }

  setUpdateBidEventListener(event: () => void): AuctionGameContext {
    this.updateEvent = event;
    return this;
  }
}
