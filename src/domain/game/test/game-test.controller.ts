import { Controller, Query, Get } from '@nestjs/common';
import { GameService } from '~/src/domain/game/services/game.service';
import { RedisTestService } from '~/src/domain/game/test/redis-test.service';
@Controller('game-test')
export class GameTestController {
  constructor(
    private readonly gameService: GameService,
    private readonly RedisTestService: RedisTestService,
  ) {}

  @Get('start')
  startAuction(@Query('id') auctionId) {
    return this.gameService.startAuction({ auctionId });
  }
  @Get('terminate')
  terminateAuction(@Query('id') auction) {
    return this.gameService.terminateAuction(auction);
  }
  @Get('redisTest')
  redisTest() {
    return this.RedisTestService.testConnection();
  }
}
