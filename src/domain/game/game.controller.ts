import { Controller, Get, Query } from '@nestjs/common';
import { GameService } from '~/src/domain/game/game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('start')
  getHello(@Query('id') id) {
    this.gameService.startAuction({ auctionId: id });
  }
  @Get('newbid')
  getNewBid(@Query('id') id, @Query('price') price) {
    this.gameService.updateBidPrice({
      auctionId: id,
      bidderId: 'test',
      bidderNickname: 'test',
      bidPrice: price,
    });
  }
}
