import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
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

  @IsOptional()
  @IsInt()
  @Min(10)
  budget: number;

  @IsNotEmpty()
  @IsBoolean()
  isPrivate: boolean;

  @ValidateIf((o) => o.isPrivate)
  @IsNotEmpty()
  @IsString()
  privateCode: string;
}
