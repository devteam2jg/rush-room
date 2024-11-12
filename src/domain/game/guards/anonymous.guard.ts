import { Injectable } from '@nestjs/common';
import { GameStatusService } from '~/src/domain/game/services/game.status.service';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';
@Injectable()
export class AnonymousGuard {
  constructor(private readonly gameStatusService: GameStatusService) {}
  canActivate(context) {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();
    const { auctionId, userId } = data.auctionId;
    if (!auctionId) {
      client.emit('ERROR', 'Auction ID is required');
      return false;
    }
    if (!userId) {
      client.emit('ERROR', 'Auction ID is required');
      return false;
    }
    const auctionContext = this.gameStatusService.getRunningContext(auctionId);
    const userData = auctionContext.getUserData(userId);
    if (!userData) {
      client.emit('ERROR', 'User is not joined');
      return false;
    }
    if (!auctionContext.currentBidItem.canBidAnonymous) {
      if (userData.socialType == SocialType.TEST) {
        client.emit('ERROR', 'Anonymous user is not allowed');
        return false;
      }
    }
    return true;
  }
}
