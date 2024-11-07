import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import { GameStatusService } from '~/src/domain/game/game.status.service';

@Injectable()
export class GameGuard implements CanActivate {
  constructor(private readonly gameStatusService: GameStatusService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();
    const auctionId = data.auctionId;

    if (!auctionId) {
      client.emit('ERROR', 'Auction ID is required');
      return false;
    }

    const isRunning = await this.gameStatusService.isRunning(auctionId);
    if (!isRunning) {
      client.emit('ERROR', 'Auction is not running');
    }

    return isRunning;
  }
}
