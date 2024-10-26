import { PickType } from '@nestjs/swagger';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';
import { UserProfileDto } from '~/src/domain/users/dto/user.dto';
import { User } from '~/src/domain/users/entities/user.entity';

export class ReadAuctionItemDto extends PickType(AuctionItem, [
  'id',
  'title',
  'description',
  'startPrice',
  'lastPrice',
  'isSold',
  'buyerId',
  'imageUrls',
] as const) {
  postedUser?: UserProfileDto;

  constructor(auctionItem: AuctionItem, postedUser?: User) {
    super();
    this.id = auctionItem.id;
    this.title = auctionItem.title;
    this.imageUrls = auctionItem.imageUrls;
    this.startPrice = auctionItem.startPrice;
    if (postedUser) this.postedUser = new UserProfileDto(postedUser);
  }
}
