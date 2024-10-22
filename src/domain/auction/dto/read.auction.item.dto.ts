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
  'itemImages',
] as const) {
  id: string;
  title: string;
  description: string;
  itemImages: string;
  startPrice: number;
  lastPrice: number;
  isSold: boolean;
  buyerId: string;
  postedUser: UserProfileDto;

  constructor(auctionItem: AuctionItem, postedUser: User) {
    super();
    this.id = auctionItem.id;
    this.title = auctionItem.title;
    this.description = auctionItem.description;
    this.itemImages = auctionItem.itemImages;
    this.startPrice = auctionItem.startPrice;
    this.lastPrice = auctionItem.lastPrice;
    this.isSold = auctionItem.isSold;
    this.buyerId = auctionItem.buyerId;
    this.postedUser = new UserProfileDto(postedUser);
  }
}
