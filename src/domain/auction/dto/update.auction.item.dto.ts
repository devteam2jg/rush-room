import { PartialType } from '@nestjs/swagger';
import { CreateAuctionItemDto } from './create.auction.item.dto';

export class UpdateAuctionItemDto extends PartialType(CreateAuctionItemDto) {}
