import { IdWithUserInfoDto } from '~/src/common/dto/id.with.user.info.dto';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { CreateAuctionItemDto } from '~/src/domain/auction/dto/auction-item/create.auction.item.dto';

export class CreateAuctionServiceDto extends IdWithUserInfoDto {
  createAuctionItemDto: CreateAuctionItemDto;
  imageUrls: string[];

  constructor(
    targetId: string,
    clientUser: JwtPayloadDto,
    createAuctionItemDto: CreateAuctionItemDto,
    imageUrls: string[],
  ) {
    super(targetId, clientUser);
    this.createAuctionItemDto = createAuctionItemDto;
    this.imageUrls = imageUrls;
  }
}
