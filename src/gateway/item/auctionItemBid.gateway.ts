import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuctionIds } from '~/src/common/dto/auctionIdsWithJwtPayload';
import { AuctionItemBidService } from '~/src/gateway/item/auctionItemBid.service';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { AuctionCommonService } from '~/src/gateway/auctionCommon.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
})
// @UseGuards(JwtAuthGuard)
export class AuctionItemBidGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly auctionCommonService: AuctionCommonService,
    private readonly auctionItemBidService: AuctionItemBidService,
    private readonly auctionService: AuctionService,
  ) {}

  /**
   * 'new_bid' 이벤트를 처리.
   * 새로운 입찰가가 현재 입찰가보다 높으면 현재 입찰가를 업데이트.
   *
   * @param bidData - auctionId와 newCurrentBid를 포함한 입찰 데이터.
   * @param socket - 클라이언트 소켓.
   */
  @SubscribeMessage('new_bid')
  handleNewBid(
    @MessageBody()
    bidData: { nickname: string; auctionId: string; newCurrentBid: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const { nickname, auctionId, newCurrentBid } = bidData;
    const newBidData = { nickname, newCurrentBid };

    if (newCurrentBid > this.auctionCommonService.getCurrentBid(auctionId)) {
      this.auctionCommonService.setCurrentBid(
        auctionId,
        newCurrentBid,
        nickname,
      );
      this.server.to(auctionId).emit('bid_updated', newBidData);
      console.log(
        `Auction ${auctionId} has a new highest bid: ${newCurrentBid}`,
      );
    } else {
      socket.emit(
        'bid_error',
        'Bid must be higher than the current highest bid.',
      );
    }
  }

  /**
   * 'finish_item' 이벤트를 처리.
   * @param socket
   * @param finishData - auctionId, auctionItemId
   */
  @SubscribeMessage('finish_item')
  async handleFinishItem(
    socket: Socket,
    finishData: { auctionId: string; auctionItemId: string; userId: string },
  ): Promise<void> {
    const { auctionId, auctionItemId } = finishData;
    const lastPrice = this.auctionCommonService.getCurrentBid(auctionId);

    const updateAuctionItemDto = { lastPrice }; // Assuming lastPrice is part of the DTO
    await this.auctionItemBidService.updateItemBidResult(
      auctionItemId,
      updateAuctionItemDto,
    );
  }
}
