import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';
import { CreateAuctionItemDto } from '~/src/domain/auction/dto/create.auction.item.dto';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { CreateAuctionItemResultDto } from '~/src/domain/auction/dto/create.auction.item.result.dto';
import { ReadAuctionItemDto } from '~/src/domain/auction/dto/read.auction.item.dto';

@Injectable()
export class AuctionItemRepository extends Repository<AuctionItem> {
  constructor(private readonly dataSource: DataSource) {
    super(AuctionItem, dataSource.createEntityManager());
  }

  async createAuctionItem(
    auctionId: string,
    createAuctionItemDto: CreateAuctionItemDto,
    clientUser: JwtPayloadDto,
  ) {
    const auctionItem = this.create({
      ...createAuctionItemDto,
      auction: { id: auctionId },
      user: { id: clientUser.id },
    });
    const createdAuctionItem = await this.save(auctionItem);
    return new CreateAuctionItemResultDto(createdAuctionItem);
  }

  async getAuctionItemsByAuctionId(
    auctionId: string,
  ): Promise<ReadAuctionItemDto[]> {
    const result = await this.createQueryBuilder('auction_item')
      .leftJoinAndSelect('auction_item.user', 'user')
      .where('auction_item.auction.id = :auctionId', { auctionId })
      .select(['auction_item', 'user.id'])
      .getMany();
    return result.map((item) => new ReadAuctionItemDto(item, item.user));
  }
}
