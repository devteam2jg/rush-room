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

  setAuctionDto(auction: Auction) {
    this._auctionDto = new AuctionDto(auction);
    return this;
  }

  setPrivateAuctionDto(auction: Auction) {
    this._auctionDto = new AuctionDto(auction, true);
    return this;
  }

  setOwnerProfile(owner: User) {
    this._ownerProfile = new UserProfileDto(owner);
    return this;
  }

  setItems(items: ReadAuctionItemDto[]) {
    this._items = items;
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
] as const) {
  constructor(auction: Auction, notEndorsed?: boolean) {
    super();
    this.id = auction.id;
    this.title = auction.title;
    this.eventDate = auction.eventDate;
    this.status = auction.status;
    this.isPrivate = auction.isPrivate;

    if (!notEndorsed) {
      this.sellingLimitTime = auction.sellingLimitTime;
      this.description = auction.description;
      this.budget = auction.budget;
    }
  }
}
