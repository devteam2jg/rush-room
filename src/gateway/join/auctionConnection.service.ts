import { Injectable } from '@nestjs/common';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { AuctionCommonService } from '~/src/gateway/auctionCommon.service';
import { Socket } from 'socket.io';
import { AuctionIds } from '~/src/common/dto/auctionIdsWithJwtPayload';

@Injectable()
export class AuctionConnectionService {
  constructor(
    private readonly auctionService: AuctionService,
    private readonly gatewayCommonService: AuctionCommonService,
  ) {}

  /**
   * 클라이언트를 지정된 경매 방에 추가하고 현재 최고 입찰가를 전송.
   *
   * @param socket - 클라이언트 소켓.
   * @param joinData - auctionId, auctionㅜ
   */
  async handleJoinInfo(socket: Socket, joinData: AuctionIds): Promise<number> {
    const { auctionId, auctionItemId } = joinData;
    socket.join(auctionId);
    console.log(`Client ${socket.id} joined auction ${auctionId}`);

    const auctionItem = await this.auctionService.getAuctionItem(
      auctionId,
      auctionItemId,
    );

    const currentPrice = this.gatewayCommonService.getCurrentBid(auctionId);
    const itemStartPrice = auctionItem.startPrice;

    if (currentPrice == null) {
      this.gatewayCommonService.setCurrentBid(
        auctionId,
        itemStartPrice,
        undefined,
      );
    }

    return currentPrice;
  }
}
