import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { CreateAuctionDto } from '~/src/domain/auction/dto/create-auction.dto';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { CreateAuctionResultDto } from '~/src/domain/auction/dto/create-auction-result.dto';

@Injectable()
export class AuctionRepository extends Repository<Auction> {
  constructor(private readonly dataSource: DataSource) {
    super(Auction, dataSource.createEntityManager());
  }

  async createAuction(
    createAuctionDto: CreateAuctionDto,
    owner: JwtPayloadDto,
  ): Promise<CreateAuctionResultDto> {
    const auction = this.create({
      ...createAuctionDto,
      user: { id: owner.id },
    });
    const result = await this.save(auction);

    return { createdAuctionId: result.id };
  }
}
