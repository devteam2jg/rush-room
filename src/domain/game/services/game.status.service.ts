import { Injectable } from '@nestjs/common';
import { AuctionGameContext } from '~/src/domain/game/context/game.context';

@Injectable()
export class GameStatusService {
  private readonly auctionsMap: Map<string, AuctionGameContext> = new Map();
  private readonly auctionsForReady: Map<string, string> = new Map();

  getRunningContext(auctionId: string): AuctionGameContext {
    return this.auctionsMap.get(auctionId);
  }
  isRunning(auctionId: string): boolean {
    return this.auctionsMap.has(auctionId);
  }
  isReady(auctionId: string): boolean {
    return this.auctionsForReady.has(auctionId);
  }
  setRunning(auctionId: string, auctionContext: AuctionGameContext) {
    this.auctionsMap.set(auctionId, auctionContext);
  }
  setReady(auctionId: string) {
    this.auctionsForReady.set(auctionId, auctionId);
  }
  isRunningOrReady(auctionId: string): boolean {
    return this.isRunning(auctionId) || this.isReady(auctionId);
  }
  deleteReady(auctionId: string) {
    this.auctionsForReady.delete(auctionId);
  }
  deleteRunning(auctionId: string) {
    this.auctionsMap.delete(auctionId);
  }
}
