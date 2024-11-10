import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { GameStatusService } from '~/src/domain/game/services/game.status.service';
import { UpdateBidPriceDto } from '~/src/domain/game/dto/game.dto';

@Processor('update-bid')
export class BidUpdateProcessor {
  constructor(private readonly gameStatusService: GameStatusService) {}

  @Process('update-bid')
  async handleUpdateBid(job: Job<UpdateBidPriceDto>): Promise<any> {
    console.log('Job received:', job.data); // 작업 데이터 확인

    const { auctionId } = job.data;
    const auctionContext = this.gameStatusService.getRunningContext(auctionId);
    console.log('Auction Context:', auctionContext); // context 확인

    if (!auctionContext) {
      throw new Error(`Auction context for ${auctionId} not found.`);
    }

    return auctionContext.updateBidPrice(job.data);
  }
}
