import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAuctionDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  eventDate: Date;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(100)
  sellingLimitTime: number;
}
