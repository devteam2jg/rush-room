import { Injectable } from '@nestjs/common';
import { UpdateAuctionItemDto } from '~/src/domain/auction/dto/update.auction.item.dto';
import { AuctionItemRepository } from '~/src/domain/auction/auction-item.repository';
import { AuctionManager } from '~/src/domain/auction/auction.manager';

@Injectable()
export class AuctionGatewayService {
  constructor(
    private readonly auctionItemRepository: AuctionItemRepository,
    private readonly auctionManager: AuctionManager,
  ) {}

  async updateItemBidResult(
    auctionItemId: string,
    updateAuctionItemDto: UpdateAuctionItemDto,
  ) {
    const result = await this.auctionItemRepository.update(
      { id: auctionItemId },
      updateAuctionItemDto,
    );

    this.auctionManager.checkAffected(result);
    return result;
  }
}
