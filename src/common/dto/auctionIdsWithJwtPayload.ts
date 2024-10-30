import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';

export class AuctionIds {
  @IsOptional()
  @IsUUID()
  auctionId: string | null;

  @IsOptional()
  @IsUUID()
  auctionItemId: string | null;

  constructor(auctionId: string | null, auctionItemId: string | null) {
    this.auctionId = auctionId;
    this.auctionItemId = auctionItemId;
  }
}

export class AuctionIdsWithJwtPayload {
  auctionIds: AuctionIds;

  @IsNotEmpty()
  clientUser: JwtPayloadDto;

  constructor(auctionIds: AuctionIds, clientUser: JwtPayloadDto) {
    this.auctionIds = auctionIds;
    this.clientUser = clientUser;
  }
}
