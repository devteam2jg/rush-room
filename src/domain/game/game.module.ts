import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { AuctionModule } from '~/src/domain/auction/auction.module';
import { GameGateway } from '~/src/domain/game/game.gateway';
import { GameController } from './game.controller';
import { UsersModule } from '~/src/domain/users/users.module';

import { GameGuard } from '~/src/domain/game/guards/game.guard';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'bid-queue', // 호출 함수가 담길 큐
    }),
    AuctionModule,
    UsersModule,
  ],
  providers: [GameGateway, GameService, GameGuard],
  exports: [GameService],
  controllers: [GameController],
})
export class GameModule {}
