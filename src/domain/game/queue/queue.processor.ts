import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UpdateBidPriceDto } from '~/src/domain/game/dto/game.dto';
import { GameService } from '~/src/domain/game/services/game.service';

@Processor('bid-queue')
export class BidProcessor {
  constructor(private readonly gameService: GameService) {}

  @Process()
  async handleBidUpdate(job: Job<UpdateBidPriceDto>) {
    const updateBidPriceDto = job.data;
    return this.gameService.updateBidPriceFromQueue(updateBidPriceDto);
  }
}
