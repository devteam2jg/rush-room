import { AuctionStatus } from '../game.context';
import { BidItem } from '../game.context';
export class LoadGameDataDto {
  auctionId: string;
  bidItems: BidItem[];
  auctionStartDateTime: Date;
  auctionStatus: AuctionStatus;
}

export class SaveGameDataDto {
  auctionId: string;
  bidItems: BidItem[];
  auctionStartDateTime: Date;
  auctionStatus: AuctionStatus;
}

export class InitialDataDto {
  id: string;
}

export class ResponseDto {
  auctionId: string;
  messageType: MessageType;
}

export enum MessageType {
  PRICE_UPDATE = 'PRICE_UPDATE',
  NOTIFICATION = 'NOTIFICATION',
  USER_MESSAGE = 'USER_MESSAGE',
  VOICE_MESSAGE = 'VOICE_MESSAGE',
}

export class UpdateBidPriceDto {
  auctionId: string;
  bidPrice: number;
  bidderId: string;
}
