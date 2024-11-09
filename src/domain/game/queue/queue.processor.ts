import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { GameStatusService } from '~/src/domain/game/services/game.status.service';
import { UpdateBidPriceDto } from '~/src/domain/game/dto/game.dto';

@Processor('bid-queue')
export class BidUpdateProcessor {
  constructor(private readonly gameStatusService: GameStatusService) {}

  @Process('bid-queue')
  async handleUpdateBid(job: Job<UpdateBidPriceDto>): Promise<any> {
    const { auctionId } = job.data;
    const auctionContext = this.gameStatusService.getRunningContext(auctionId);
    return auctionContext.updateBidPrice(job.data);
  }
}
