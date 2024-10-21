import { AuctionPolicy } from '~/src/domain/auction/auction.policy';

export class UserErrorMessage {
  static readonly NOT_FOUND_USER = 'invalid user id';
  static readonly TOO_EARLY_EVENT_TIME = `경매 생성 시간은 현재 시간보다 ${AuctionPolicy.MIN_START_MINUTE}분이상 이후여야합니다.`;
}
