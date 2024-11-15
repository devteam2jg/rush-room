import { PartialType } from '@nestjs/swagger';
import { CreateAuctionItemDto } from './auction-item/create.auction.item.dto';

export class UpdateAuctionItemDto extends PartialType(CreateAuctionItemDto) {
  lastPrice?: number;
  isSold?: boolean;
  buyerId?: string;
}
