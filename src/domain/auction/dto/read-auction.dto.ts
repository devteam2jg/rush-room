import { PickType } from '@nestjs/swagger';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { User } from '~/src/domain/users/entities/user.entity';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { ReadAuctionItemDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.dto';
import { UserProfileDto } from '~/src/domain/users/dto/user.dto';

export class ReadAuctionDto extends PickType(Auction, [
  'id',
  'title',
  'description',
  'eventDate',
  'sellingLimitTime',
  'status',
  'isPrivate',
] as const) {
  ownerProfile: UserProfileDto;
  items: ReadAuctionItemDto[];
  isOwner: boolean;

  constructor(
    auction: Auction,
    owner: User,
    clientUser: JwtPayloadDto,
    auctionItems: ReadAuctionItemDto[],
  ) {
    super();
    // mapping
    this.id = auction.id;
    this.title = auction.title;
    this.description = auction.description;
    this.eventDate = auction.eventDate;
    this.sellingLimitTime = auction.sellingLimitTime;
    this.status = auction.status;
    this.isPrivate = auction.isPrivate;
    this.ownerProfile = new UserProfileDto(owner);
    this.isOwner = owner.id === clientUser.id;
    this.items = auctionItems;
  }
}
