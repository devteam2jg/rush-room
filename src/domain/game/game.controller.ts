import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { JwtAuthGuard } from '~/src/domain/auth/guards/auth.guard';
import { GameService } from '~/src/domain/game/services/game.service';
import { GetJwtPayload } from '~/src/domain/users/get-user.decorator';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly auctionService: AuctionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('start/:id')
  async startAuction(@Param('id') auctionId, @GetJwtPayload() payload) {
    const { id } = payload;
    if (await this.auctionService.isOwner(auctionId, id))
      return this.gameService.startAuction({ auctionId });
    return { message: 'You are not the owner of this auction' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('reduce')
  async reduceTime(
    @Query('id') auctionId,
    @Query('time') time,
    @GetJwtPayload() payload,
  ) {
    const { id } = payload;
    if (await this.auctionService.isOwner(auctionId, id))
      return this.gameService.reduceTime(auctionId, id, time);
    return { message: 'You are not the owner of this auction' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('skip/:id')
  async skipBidItem(@Param('id') auctionId, @GetJwtPayload() payload) {
    const { id } = payload;
    if (await this.auctionService.isOwner(auctionId, id))
      return this.gameService.skip(auctionId);
    return { message: 'You are not the owner of this auction' };
  }
  // @UseGuards(JwtAuthGuard)
  // @Get('terminate/:id')
  // async terminateAuction(@Param('id') auctionId, @GetJwtPayload() payload) {
  //   const { id } = payload;
  //   if (await this.auctionService.isOwner(auctionId, id))
  //     return this.gameService.terminate(auctionId);
  //   return { message: 'You are not the owner of this auction' };
  // }
  @UseGuards(JwtAuthGuard)
  @Get('timer/activate')
  async activateTimer() {
    return this.gameService.activateAutoStartAuctionTimer();
  }
  @UseGuards(JwtAuthGuard)
  @Get('timer/deactivate')
  async deactivateTimer() {
    return this.gameService.deactivateAutoStartAuctionTimer();
  }
}
