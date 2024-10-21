import { PartialType } from '@nestjs/swagger';
import { CreateAuctionDto } from './create-auction.dto';
import { Status } from '~/src/domain/auction/entities/auction.entity';

export class UpdateAuctionDto extends PartialType(CreateAuctionDto) {
  status?: Status;
}
