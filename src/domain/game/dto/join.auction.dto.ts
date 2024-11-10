import { IsNotEmpty, IsString } from 'class-validator';
import { Socket } from 'socket.io';

export class JoinAuctionDto {
  @IsNotEmpty()
  @IsString()
  auctionId: string;

  @IsNotEmpty()
  @IsString()
  userId: string;

  socket?: Socket;
}
