import { IsNotEmpty, IsString } from 'class-validator';

export class JoinAuctionDto {
  @IsNotEmpty()
  @IsString()
  auctionId: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}
