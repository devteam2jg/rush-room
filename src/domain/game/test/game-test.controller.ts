import { Controller, Query, Get } from '@nestjs/common';
import { GameService } from '~/src/domain/game/services/game.service';

Controller('game-test');
export class GameTestController {
  constructor(private readonly gameService: GameService) {}

  @Get('start')
  startAuction(@Query('id') auctionId) {
    return this.gameService.startAuction({ auctionId });
  }
  @Get('terminate')
  terminateAuction(@Query('id') auction) {
    return this.gameService.terminateAuction(auction);
  }
}
