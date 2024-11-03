import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { AuctionModule } from '~/src/domain/auction/auction.module';

@Module({
  imports: [AuctionModule],
  providers: [GameService],
})
export class GameModule {}
