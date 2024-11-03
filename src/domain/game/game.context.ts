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
  picture: string;
}
export class AuctionGameContext {
  auctionId: string;
  bidItems: BidItem[];
  auctionStartDateTime: number;
  private auctionStatus: AuctionStatus;
  private currentBidItem: BidItem;
}
