import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { EnterPrivateAuctionDto } from '~/src/domain/auction/dto/auction/enter.private.auction.dto';

export class EnterPrivateAuctionServiceDto {
  auctionId: string;
  clientId: string;
  userPrivateCode: string;

  constructor(
    auctionId: string,
    clientUser: JwtPayloadDto,
    enterPrivateDto: EnterPrivateAuctionDto,
  ) {
    this.auctionId = auctionId;
    this.clientId = clientUser.id;
    this.userPrivateCode = enterPrivateDto.privateCode;
  }
}
