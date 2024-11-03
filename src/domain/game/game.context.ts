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

  constructor(
    auctionId: string,
    auctionStartDateTime: Date,
    bidItems: BidItem[],
  ) {
    this.auctionId = auctionId;
    this.auctionStartDateTime = auctionStartDateTime;
    this.bidItems = bidItems;
    this.auctionStatus = AuctionStatus.READY;
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

  private saveEvent = null;
  setSaveEvent(eventFunction: () => void) {
    this.saveEvent = eventFunction;
  }
  save() {
    this.saveEvent();
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
