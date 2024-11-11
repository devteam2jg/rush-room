import { Module } from '@nestjs/common';
import { GameService } from './services/game.service';
import { AuctionModule } from '~/src/domain/auction/auction.module';
import { GameGateway } from '~/src/domain/game/game.gateway';
import { GameController } from './game.controller';
import { UsersModule } from '~/src/domain/users/users.module';

import { GameGuard } from '~/src/domain/game/guards/game.guard';
import { GameStatusService } from '~/src/domain/game/services/game.status.service';
import { GameTestController } from '~/src/domain/game/test/game-test.controller';
import { BullModule } from '@nestjs/bull';
import { BidUpdateProcessor } from '~/src/domain/game/queue/queue.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'update-bid-queue',
    }),
    AuctionModule,
    UsersModule,
  ],
  providers: [
    GameGateway,
    GameService,
    GameGuard,
    GameStatusService,
    BidUpdateProcessor,
  ],
  exports: [GameService],
  controllers: [GameController, GameTestController],
})
export class GameModule {}
