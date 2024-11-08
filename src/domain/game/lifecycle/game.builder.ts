import { AuctionGame } from '~/src/domain/game/lifecycle/game.lifecycle';
import { LifecycleFuctionDto } from '~/src/domain/game/dto/lifecycle.dto';
export class GameStarter {
  static launch(auctionId: string, lifecycle: LifecycleFuctionDto) {
    new AuctionGame(auctionId, lifecycle).run();
  }
}
