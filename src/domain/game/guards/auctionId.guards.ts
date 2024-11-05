import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GameService } from '~/src/domain/game/game.service';

@Injectable()
export class AuctionIsRunningGuard implements CanActivate {
  constructor(private readonly gameService: GameService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const data = context.switchToWs().getData();
    const auctionId = data.auctionId;
    return this.gameService.isRunning(auctionId);
  }
}
