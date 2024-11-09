import { Module } from '@nestjs/common';
import { GameService } from './services/game.service';
import { AuctionModule } from '~/src/domain/auction/auction.module';
import { GameGateway } from '~/src/domain/game/game.gateway';
import { GameController } from './game.controller';
import { UsersModule } from '~/src/domain/users/users.module';

import { GameGuard } from '~/src/domain/game/guards/game.guard';
import { GameStatusService } from '~/src/domain/game/services/game.status.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'bid-queue',
    }),
    AuctionModule,
    UsersModule,
  ],
  providers: [GameGateway, GameService, GameGuard, GameStatusService],
  exports: [GameService],
  controllers: [GameController],
})
export class GameModule {}
