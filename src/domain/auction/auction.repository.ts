import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { CreateAuctionDto } from '~/src/domain/auction/dto/create-auction.dto';

@Injectable()
export class AuctionRepository extends Repository<Auction> {
  constructor(private readonly dataSource: DataSource) {
    super(Auction, dataSource.createEntityManager());
  }

  async createAuction(createAuctionDto: CreateAuctionDto) {
    const auction = this.create(createAuctionDto);
    return this.save(auction);
  }
}
