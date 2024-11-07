import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { JwtAuthGuard } from '~/src/domain/auth/guards/auth.guard';
import { GameService } from '~/src/domain/game/game.service';
import { GetJwtPayload } from '~/src/domain/users/get-user.decorator';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly auctionService: AuctionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('start/:id')
  startAuction(@Param('id') auctionId, @GetJwtPayload() payload) {
    const { userId } = payload;
    if (this.auctionService.isOwner(auctionId, userId))
      return this.gameService.startAuction({ auctionId });
    return { message: 'You are not the owner of this auction' };
  }
}
