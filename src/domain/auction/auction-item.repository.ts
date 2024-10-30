import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';
import { CreateAuctionServiceDto } from '~/src/domain/auction/dto/service/create.auction.service.dto';

@Injectable()
export class AuctionItemRepository extends Repository<AuctionItem> {
  constructor(private readonly dataSource: DataSource) {
    super(AuctionItem, dataSource.createEntityManager());
  }

  async createAuctionItem(createAuctionServiceDto: CreateAuctionServiceDto) {
    const auctionId = createAuctionServiceDto.auctionIds.auctionId;
    const { createAuctionItemDto, clientUser, imageUrls } =
      createAuctionServiceDto;
    const auctionItem = this.create({
      imageUrls,
      ...createAuctionItemDto,
      auction: { id: auctionId },
      user: { id: clientUser.id },
    });

    return await this.save(auctionItem);
  }

  async getAuctionItemsByAuctionIdAndItemId(
    auctionId: string,
    auctionItemId?: string,
  ): Promise<AuctionItem[]> {
    const query = this.createQueryBuilder('auction_item')
      .leftJoinAndSelect('auction_item.user', 'user')
      .where('auction_item.auction.id = :auctionId', { auctionId });

    if (auctionItemId) {
      query.andWhere('auction_item.id = :auctionItemId', { auctionItemId });
    }

    query.select([
      'auction_item',
      'user.id',
      'user.name',
      'user.email',
      'user.profileUrl',
      'user.thumbnailUrl',
    ]);

    return await query.getMany();
  }
}
