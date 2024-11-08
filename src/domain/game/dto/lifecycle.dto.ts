import { AuctionGameContext } from '~/src/domain/game/context/game.context';

export type JobFunction = (
  auctionContext: AuctionGameContext,
) => Promise<boolean>;

export class LifecycleFuctionDto {
  /*
   * 이 작업이 실행 된 후에는 모든 정보가 준비되어 있어야합니다.
   */
  jobBeforeRoomCreate?: JobFunction;
  jobAfterRoomCreate?: JobFunction;

  jobBeforeRoomDestroy?: JobFunction;
  jobAfterRoomDestroy?: JobFunction;

  jobBeforeBidCreate?: JobFunction;
  jobAfterBidCreate?: JobFunction;

  jobBeforeBidRunning?: JobFunction;
  jobAfterBidRunning?: JobFunction;

  jobBeforeBidEnd?: JobFunction;
  jobAfterBidEnd?: JobFunction;
}
export function findNullAndsetDefaultValue(lifecycle: LifecycleFuctionDto) {
  if (!lifecycle.jobBeforeRoomCreate)
    lifecycle.jobBeforeRoomCreate = async () => true;
  if (!lifecycle.jobAfterRoomCreate)
    lifecycle.jobAfterRoomCreate = async () => true;
  if (!lifecycle.jobBeforeRoomDestroy)
    lifecycle.jobBeforeRoomDestroy = async () => true;
  if (!lifecycle.jobAfterRoomDestroy)
    lifecycle.jobAfterRoomDestroy = async () => true;
  if (!lifecycle.jobBeforeBidCreate)
    lifecycle.jobBeforeBidCreate = async () => true;
  if (!lifecycle.jobAfterBidCreate)
    lifecycle.jobAfterBidCreate = async () => true;
  if (!lifecycle.jobBeforeBidRunning)
    lifecycle.jobBeforeBidRunning = async () => true;
  if (!lifecycle.jobAfterBidRunning)
    lifecycle.jobAfterBidRunning = async () => true;
  if (!lifecycle.jobBeforeBidEnd) lifecycle.jobBeforeBidEnd = async () => true;
  if (!lifecycle.jobAfterBidEnd) lifecycle.jobAfterBidEnd = async () => true;
  return lifecycle;
}
