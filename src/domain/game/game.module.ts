import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { AuctionModule } from '~/src/domain/auction/auction.module';
import { GameGateway } from '~/src/domain/game/game.gateway';
import { GameController } from './game.controller';
import { UsersModule } from '~/src/domain/users/users.module';
import { GameGuard } from '~/src/domain/game/guards/game.guard';
@Module({
  imports: [AuctionModule, UsersModule],
  providers: [GameGateway, GameService, GameGuard],
  exports: [GameService],
  controllers: [GameController],
})
export class GameModule {}
