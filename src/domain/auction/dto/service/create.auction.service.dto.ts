import {
  AuctionIds,
  AuctionIdsWithJwtPayload,
} from '~/src/common/dto/auctionIdsWithJwtPayload';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { CreateAuctionItemDto } from '~/src/domain/auction/dto/auction-item/create.auction.item.dto';

export class CreateAuctionServiceDto extends AuctionIdsWithJwtPayload {
  createAuctionItemDto: CreateAuctionItemDto;
  imageUrls: string[];

  constructor(
    auctionIds: AuctionIds,
    clientUser: JwtPayloadDto,
    createAuctionItemDto: CreateAuctionItemDto,
    imageUrls: string[],
  ) {
    super(auctionIds, clientUser);
    this.createAuctionItemDto = createAuctionItemDto;
    this.imageUrls = imageUrls;
  }
}
