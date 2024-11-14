import { PickType } from '@nestjs/swagger';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { User } from '~/src/domain/users/entities/user.entity';
import { ReadAuctionItemDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.dto';
import { UserProfileDto } from '~/src/domain/users/dto/user.dto';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';

export class ReadUser {
  isOwner: boolean;
  endorsed: boolean;

  constructor(owner: User, clientUser: JwtPayloadDto, isEndorsed: boolean) {
    this.isOwner = clientUser ? owner.id === clientUser.id : true;
    this.endorsed = isEndorsed;
  }
}

export class ReadAuctionDto {
  auctionDto: AuctionDto;
  ownerProfile: UserProfileDto;
  items: ReadAuctionItemDto[];
  readUser: ReadUser;

  constructor(readAuctionDtoBuilder: ReadAuctionDtoBuilder) {
    this.auctionDto = readAuctionDtoBuilder._auctionDto;
    this.ownerProfile = readAuctionDtoBuilder._ownerProfile;
    this.items = readAuctionDtoBuilder._items;
    this.readUser = readAuctionDtoBuilder._readUser;
  }
}

export class ReadAuctionDtoBuilder {
  _auctionDto: AuctionDto;
  _ownerProfile: UserProfileDto;
  _items: ReadAuctionItemDto[];
  _readUser: ReadUser;

  mapAuctionToDto(auction: Auction) {
    this._auctionDto = new AuctionDto(auction);
    return this;
  }

  setAuctionDto(auctionDto: AuctionDto) {
    this._auctionDto = auctionDto;
    return this;
  }

  setPrivateAuctionDto(auction: Auction) {
    this._auctionDto = new AuctionDto(auction, true);
    return this;
  }

  setOwnerProfile(owner: User) {
    this._ownerProfile = new UserProfileDto(owner);
    if (this._auctionDto?.user) this._auctionDto.user = undefined;
    return this;
  }

  setItems(items: ReadAuctionItemDto[]) {
    this._items = items;
    if (this._auctionDto?.auctionItems)
      this._auctionDto.auctionItems = undefined;
    return this;
  }

  setReadUser(owner: User, clientUser: JwtPayloadDto, isEndorsed: boolean) {
    this._readUser = new ReadUser(owner, clientUser, isEndorsed);
    return this;
  }

  build() {
    return new ReadAuctionDto(this);
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
  'budget',
  'auctionItems',
] as const) {
  user: User;
  firstItem: { id: string; imageUrl: string[] } | null;

  constructor(auction: Auction, notEndorsed?: boolean) {
    super();
    this.id = auction.id;
    this.title = auction.title;
    this.eventDate = auction.eventDate;
    this.status = auction.status;
    this.isPrivate = auction.isPrivate;
    this.user = auction.user;
    this.firstItem =
      auction.auctionItems.length > 0
        ? {
            id: auction.auctionItems[0].id,
            imageUrl: auction.auctionItems[0].imageUrls,
          }
        : null;

    if (!notEndorsed) {
      this.sellingLimitTime = auction.sellingLimitTime;
      this.description = auction.description;
      this.budget = auction.budget;
    }
  }
}
