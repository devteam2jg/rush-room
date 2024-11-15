import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { GameStatusService } from '~/src/domain/game/services/game.status.service';
import { UpdateBidPriceDto } from '~/src/domain/game/dto/game.dto';

@Processor('update-bid-queue')
export class BidUpdateProcessor {
  constructor(private readonly gameStatusService: GameStatusService) {}

  @Process('updateBid')
  async updateBid(job: Job<UpdateBidPriceDto>): Promise<any> {
    try {
      const { auctionId } = job.data;
      const auctionContext =
        this.gameStatusService.getRunningContext(auctionId);

      if (!auctionContext) {
        throw new Error(`Auction context for ${auctionId} not found.`);
      }

      return await auctionContext.updateBidPrice(job.data);
    } catch (error) {
      console.error('Error processing job:', error);
      throw error;
    }
  }
}
