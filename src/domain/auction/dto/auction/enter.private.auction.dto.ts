import { IsString, MaxLength, MinLength } from 'class-validator';

export class EnterPrivateAuctionDto {
  @IsString()
  @MaxLength(20)
  @MinLength(3)
  privateCode: string;
}
