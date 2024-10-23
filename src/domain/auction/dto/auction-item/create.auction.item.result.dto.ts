import { ApiProperty } from '@nestjs/swagger';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';

export class CreateAuctionItemResultDto {
  @ApiProperty({
    description: 'UUID of the created auction item',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  auctionItemId: string;

  constructor(auctionItem: AuctionItem) {
    this.auctionItemId = auctionItem.id;
  }
}
