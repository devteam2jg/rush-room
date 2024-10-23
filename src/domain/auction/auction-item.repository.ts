import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';
import { CreateAuctionItemDto } from '~/src/domain/auction/dto/auction-item/create.auction.item.dto';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';

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

    return await this.save(auctionItem);
  }

  async getAuctionItemById(id: string): Promise<AuctionItem> {
    return await this.createQueryBuilder('auction_item')
      .leftJoinAndSelect('auction_item.user', 'user')
      .where('auction_item.id = :id', { id })
      .select([
        'auction_item',
        'user.id',
        'user.name',
        'user.email',
        'user.profileUrl',
        'user.thumbnailUrl',
      ])
      .getOne();
  }

  async getAuctionItemsByAuctionId(auctionId: string): Promise<AuctionItem[]> {
    return await this.createQueryBuilder('auction_item')
      .leftJoinAndSelect('auction_item.user', 'user')
      .where('auction_item.auction.id = :auctionId', { auctionId })
      .select([
        'auction_item',
        'user.id',
        'user.name',
        'user.email',
        'user.profileUrl',
        'user.thumbnailUrl',
      ])
      .getMany();
  }
}
