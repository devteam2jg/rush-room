import { PartialType } from '@nestjs/mapped-types';
import { AuctionStatus, BidItem } from '../game.context';
import { Socket } from 'socket.io';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';

export class GameDataDto {
  auctionId: string;
  auctionTitle: string;
  bidItems: BidItem[];
  auctionStartDateTime: Date;
  auctionStatus: AuctionStatus;
  joinedUsers: UserDataDto[];
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
  TIME_UPDATE = 'TIME_UPDATE',
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
  bidderNickname: string;
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
