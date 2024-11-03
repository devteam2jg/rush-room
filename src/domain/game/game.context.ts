import {
  LoadGameDataDto,
  SaveGameDataDto,
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

  private loadEvent: (auctionId: string) => Promise<LoadGameDataDto> = null;
  private saveEvent: (saveGameDataDto: SaveGameDataDto) => void = null;
  constructor(
    loadfun: (auctionId: string) => Promise<LoadGameDataDto>,
    savefun: (saveGameDataDto: SaveGameDataDto) => void,
    initialDataDto: { id: string },
  ) {
    this.loadEvent = loadfun;
    this.saveEvent = savefun;
    const { id } = initialDataDto;
    this.auctionId = id;
  }

  setNextBidItem() {
    this.currentBidItem = this.bidItems.find(
      (item) => item.itemId !== this.currentBidItem.itemId,
    );
  }
  private updateEvent = null;
  setUpdateBidEvent(eventfuntion: () => void) {
    this.updateEvent = eventfuntion;
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

  setSaveEvent(eventFunction: () => Promise<SaveGameDataDto>) {
    this.saveEvent = eventFunction;
  }
  async load() {
    const data = await this.loadEvent(this.auctionId);
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
  updateBidPrice(bidPrice: number, bidderId: string): boolean {
    if (!this.currentBidItem.canBid) return false;
    if (bidPrice <= this.currentBidItem.bidPrice) return false;
    this.prevBidPrice = this.currentBidItem.bidPrice;
    this.prevBidderId = this.currentBidItem.bidderId;
    this.currentBidItem.bidPrice = bidPrice;
    this.currentBidItem.bidderId = bidderId;
    this.updateEvent();
    return true;
  }
}
