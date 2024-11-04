import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { AuctionModule } from '~/src/domain/auction/auction.module';
import { GameGateway } from '~/src/domain/game/game.gateway';

@Module({
  imports: [AuctionModule],
  providers: [GameService, GameGateway],
})
export class GameModule {}
