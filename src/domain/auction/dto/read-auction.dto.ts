import { PartialType } from '@nestjs/mapped-types';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { User } from '~/src/domain/users/entities/user.entity';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';

export class ReadAuctionDto extends PartialType(Auction) {
  ownerId: string;
  ownerEmail: string;
  ownerProfileImg: string;
  ownerThumbnailImg: string;
  ownerNickname: string;
  isOwner: boolean;

  constructor(auction: Auction, owner: User, clientUser: JwtPayloadDto) {
    super();
    // mapping
    this.id = auction.id;
    this.title = auction.title;
    this.description = auction.description;
    this.eventDate = auction.eventDate;
    this.sellingLimitTime = auction.sellingLimitTime;
    this.status = auction.status;
    this.isPrivate = auction.isPrivate;
    // 주최자 정보
    this.ownerId = owner.id;
    this.ownerEmail = owner.email;
    this.ownerNickname = owner.name;
    this.ownerProfileImg = owner.profileUrl;
    this.ownerThumbnailImg = owner.thumbnailUrl;
    this.isOwner = owner.id === clientUser.id;
  }
}
