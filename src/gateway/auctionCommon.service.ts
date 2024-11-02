import { Injectable } from '@nestjs/common';

interface AuctionInfo {
  currentBid: number;
  auctionTime?: Date;
  sellingLimitTime?: number;
  bidUserId?: string;
}

@Injectable()
export class AuctionCommonService {
  private auctionInfo: { [auctionId: string]: AuctionInfo } = {};

  setAuctionInfo(auctionId: string, auctionInfo: AuctionInfo): void {
    this.auctionInfo[auctionId] = auctionInfo;
  }

  getAuctionInfo(auctionId: string): AuctionInfo {
    return this.auctionInfo[auctionId];
  }

  getCurrentBid(auctionId: string): number {
    if (!this.auctionInfo[auctionId]) {
      return null;
    }
    return this.auctionInfo[auctionId].currentBid;
  }

  setCurrentBid(auctionId: string, bid: number, userId: string): void {
    const auctionInfo = this.auctionInfo[auctionId];
    if (!auctionInfo) {
      this.auctionInfo[auctionId] = {
        currentBid: bid,
        bidUserId: userId,
        // 시간이 구현되면 저장
        //auctionTime: new Date(),
        //sellingLimitTime: 3,
      };
    } else {
      this.auctionInfo[auctionId].currentBid = bid;
    }
  }
}
