import { AuctionGame } from '~/src/domain/game/lifecycle/game.lifecycle';
import { LifecycleFuctionDto } from '~/src/domain/game/dto/lifecycle.dto';
export class GameStarter {
  static launch(lifecycle: LifecycleFuctionDto) {
    new AuctionGame(lifecycle).run();
    return {
      message: 'Auction Started',
    };
  }
}
