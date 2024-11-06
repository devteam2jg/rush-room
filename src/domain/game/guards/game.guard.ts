import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { GameService } from '~/src/domain/game/game.service';

@Injectable()
export class GameGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();
    const auctionId = data.auctionId;

    if (!auctionId) {
      client.emit('ERROR', 'Auction ID is required');
      return false;
    }

    const isRunning = await this.gameService.isRunning(auctionId);
    if (!isRunning) {
      client.emit('ERROR', 'Auction is not running');
    }

    return isRunning;
  }
}
