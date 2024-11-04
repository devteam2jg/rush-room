import {
  LoadGameDataDto,
  SaveGameDataDto,
  InitialDataDto,
  ResponseDto,
  messageType,
  UpdateBidPriceDto,
} from '~/src/domain/game/dto/game.dto';
import { UserProfileDto } from '../users/dto/user.dto';

export enum AuctionStatus {
  READY = 'READY',
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
}
export class BidItem {
  itemId: string;
  sellerId: UserProfileDto;
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

  prevBidPrice: number;
  prevBidderId: string;

  constructor(initialDataDto: InitialDataDto) {
    const { id } = initialDataDto;
    this.auctionId = id;
  }

  setNextBidItem() {
    this.currentBidItem = this.bidItems.find(
      (item) => item.itemId !== this.currentBidItem.itemId,
    );
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

  async load() {
    const data: LoadGameDataDto = await this.loadEvent(this.auctionId, this);
    const { auctionId, bidItems, auctionStartDateTime, auctionStatus } = data;
    this.auctionId = auctionId;
    this.bidItems = bidItems;
    this.auctionStartDateTime = auctionStartDateTime;
    this.auctionStatus = auctionStatus;
    this.currentBidItem = this.bidItems[0];
  }
  save() {
    this.saveEvent(new SaveGameDataDto());
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
    const { bidPrice, bidderId } = updateBidPriceDto;
    if (!this.currentBidItem.canBid) return false;
    if (bidPrice <= this.currentBidItem.bidPrice) return false;
    this.prevBidPrice = this.currentBidItem.bidPrice;
    this.prevBidderId = this.currentBidItem.bidderId;
    this.currentBidItem.bidPrice = bidPrice;
    this.currentBidItem.bidderId = bidderId;
    this.updateEvent();
    this.sendtoClient(messageType.PRICE_UPDATE);
    return true;
  }

  sendtoClient(messageType: MessageType) {
    const responseDto = new ResponseDto();
    this.socketEvent(responseDto);
  }

  /**
   * event listener list
   */

  private socketEvent: (response: ResponseDto) => boolean = null;

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
    event: (response: ResponseDto) => boolean,
  ): AuctionGameContext {
    this.socketEvent = event;
    return this;
  }

  setUpdateBidEventListener(event: () => void): AuctionGameContext {
    this.updateEvent = event;
    return this;
  }
}
