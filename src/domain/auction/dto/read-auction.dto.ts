import { PickType } from '@nestjs/swagger';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { User } from '~/src/domain/users/entities/user.entity';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { ReadAuctionItemDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.dto';
import { UserProfileDto } from '~/src/domain/users/dto/user.dto';

export class ReadAuctionDto {
  auctionDto: AuctionDto;
  ownerProfile?: UserProfileDto;
  items?: ReadAuctionItemDto[];

  constructor(
    auction: Auction,
    owner?: User,
    clientUser?: JwtPayloadDto,
    auctionItems?: ReadAuctionItemDto[],
  ) {
    this.auctionDto = new AuctionDto(auction, owner, clientUser);
    if (!auction.isPrivate && owner)
      this.ownerProfile = new UserProfileDto(owner);
    if (auctionItems && auctionItems.length > 0) this.items = auctionItems;
  }
}

export class AuctionDto extends PickType(Auction, [
  'id',
  'title',
  'description',
  'eventDate',
  'sellingLimitTime',
  'status',
  'isPrivate',
] as const) {
  isOwner?: boolean;

  constructor(auction: Auction, owner?: User, clientUser?: JwtPayloadDto) {
    super();
    this.id = auction.id;
    this.title = auction.title;
    this.description = auction.description;
    this.eventDate = auction.eventDate;
    this.sellingLimitTime = auction.sellingLimitTime;
    this.status = auction.status;
    this.isPrivate = auction.isPrivate;
    if (clientUser && owner) this.isOwner = owner.id === clientUser.id;
  }
}
