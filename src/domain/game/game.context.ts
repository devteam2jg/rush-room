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
}
export class AuctionGameContext {
  auctionId: string;
  bidItems: BidItem[];
  auctionStartDateTime: Date;
  private auctionStatus: AuctionStatus;
  private currentBidItem: BidItem;
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
}
