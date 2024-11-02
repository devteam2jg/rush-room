import { Injectable } from '@nestjs/common';

@Injectable()
export class AuctionCommonService {
  private currentBids: {
    [auctionId: string]: { currentBid: number; userId: string };
  } = {};

  /**
   * 경매의 현재 입찰가를 반환.
   *
   * @param auctionId - 경매 ID.
   */
  getCurrentBid(auctionId: string): number {
    return this.currentBids[auctionId]?.currentBid;
  }

  /**
   * 경매의 현재 입찰가를 설정.
   *
   * @param auctionId - 경매 ID.
   * @param currentBid - 입찰가.
   * @param userId - 입찰자 ID.
   */ ㅎ;
  setCurrentBid(auctionId: string, currentBid: number, userId: string): void {
    this.currentBids[auctionId] = { currentBid, userId };
  }
}
