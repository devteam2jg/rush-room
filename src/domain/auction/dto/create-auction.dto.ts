import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAuctionDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
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
  @Min(1)
  @Max(60)
  sellingLimitTime: number;
}
