import { CreateAuctionDto } from './create-auction.dto';
import { Status } from '~/src/domain/auction/entities/auction.entity';
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAuctionDto extends PartialType(CreateAuctionDto) {
  @IsOptional()
  @IsEnum(Status)
  @Transform(({ value }) => Status[value as keyof typeof Status])
  status?: Status;
}
