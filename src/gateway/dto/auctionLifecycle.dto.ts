export enum AuctionStatus {
  READY = 'READY',
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
}

export class AuctionLifecycleDto {
  auctionId: string;
  itemIds: string[];
  currentBid: number;
  currentBidderId: string;
  auctionStatus: AuctionStatus;
  auctionStartDateTime: number;
  auctionEndDateTime: number; // 아래 리밋 타임과 아이템 개수로 계산
  auctionItemSellingLimitTime: number;
  bidHistory: {
    bidderId: string;
    bidAmount: number;
    timestamp: Date;
  }[];

  constructor(
    auctionId: string,
    itemIds: string[],
    currentBid: number,
    currentBidderId: string,
    auctionStatus: AuctionStatus,
    auctionStartDateTime: number,
    auctionItemSellingLimitTime: number,
    bidHistory: { bidderId: string; bidAmount: number; timestamp: Date }[],
  ) {
    this.auctionId = auctionId;
    this.itemIds = itemIds;
    this.currentBid = currentBid;
    this.currentBidderId = currentBidderId;
    this.auctionStatus = auctionStatus;
    this.auctionStartDateTime = auctionStartDateTime;
    this.auctionItemSellingLimitTime = auctionItemSellingLimitTime;
    this.bidHistory = bidHistory;
    // 동적으로 auctionEndDateTime 계산
    this.auctionEndDateTime =
      auctionStartDateTime + itemIds.length * auctionItemSellingLimitTime;
  }
}
