import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UpdateBidPriceDto } from '~/src/domain/game/dto/game.dto';
import { GameService } from '~/src/domain/game/services/game.service';

@Processor('bid-queue')
export class BidProcessor {
  constructor(private readonly gameService: GameService) {}

  @Process()
  async handleBidUpdate(job: Job<UpdateBidPriceDto>): Promise<boolean> {
    try {
      const result = await this.gameService.updateBidPriceFromQueue(job.data);
      return result;
    } catch (error) {
      throw new Error(`입찰 queue 오류 발생: ${error.message}`);
    }
  }
}
