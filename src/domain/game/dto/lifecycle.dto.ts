import {
  LoadGameDataDto,
  SaveGameDataDto,
} from '~/src/domain/game/dto/game.dto';
import { AuctionGameContext } from '~/src/domain/game/game.context';

export type JobFunction = (
  auctionContext: AuctionGameContext,
) => Promise<boolean>;

export class LifecycleFuctionDto {
  auctionId: string;
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

  socketEvent?: (response: any, data: any) => boolean;
  loadEvent?: (auctionId: string) => Promise<LoadGameDataDto>;
  saveEvent?: (saveGameDataDto: SaveGameDataDto) => Promise<boolean>;
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
