import { Injectable } from '@nestjs/common';

@Injectable()
export class GatewayCommonService {
  private currentBids: { [auctionId: string]: number } = {};

  async getCurrentBid(auctionId: string): Promise<number> {
    return this.currentBids[auctionId];
  }

  async setCurrentBid(auctionId: string, bid: number): Promise<void> {
    this.currentBids[auctionId] = bid;
  }
}
