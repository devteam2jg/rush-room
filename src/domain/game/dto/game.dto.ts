import { PartialType } from '@nestjs/mapped-types';
import { AuctionStatus } from '../game.context';
import { BidItem } from '../game.context';
import { Socket } from 'socket.io';

export class GameDataDto {
  auctionId: string;
  bidItems: BidItem[];
  auctionStartDateTime: Date;
  auctionStatus: AuctionStatus;
  callback: () => void;
}

export class LoadGameDataDto extends GameDataDto {}

export class SaveGameDataDto extends PartialType(GameDataDto) {
  auctionId: string;
  bidItems: BidItem[];
  auctionStatus: AuctionStatus;
}

export class InitialDataDto {
  id: string;
}

export enum MessageType {
  PRICE_UPDATE = 'PRICE_UPDATE',
  NOTIFICATION = 'NOTIFICATION',
  USER_MESSAGE = 'USER_MESSAGE',
  VOICE_MESSAGE = 'VOICE_MESSAGE',
}
export class BidDataDto {
  socket: Socket;
  auctionId: string;
  MessageType: MessageType;

  userId: string;
  nickname: string;
  bidPrice: number;
  bidderId: string;

  message: string;
  data: Blob;
}

export class UpdateBidPriceDto extends PartialType(BidDataDto) {
  auctionId: string;
  bidPrice: number;
  bidderId: string;
}

export class ResponseDto {
  auctionId: string;
  messageType: MessageType;
  socket?: Socket;
}

export class UserMessageDto {
  auctionId: string;
  userId: string;
  message: string;
  nickname: string;
}
