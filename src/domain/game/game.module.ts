import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { AuctionModule } from '~/src/domain/auction/auction.module';
import { GameGateway } from '~/src/domain/game/game.gateway';
import { GameController } from './game.controller';
@Module({
  imports: [AuctionModule],
  providers: [GameGateway, GameService],
  exports: [GameService],
  controllers: [GameController],
})
export class GameModule {}
