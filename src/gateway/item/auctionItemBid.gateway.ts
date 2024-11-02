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
   * `new_bid` 이벤트를 처리.
   * 새로운 입찰가가 현재 입찰가보다 높으면 현재 입찰가를 업데이트.
   *
   * @param bidData - 경매 ID와 새로운 입찰 금액을 포함한 데이터.
   * userId는 현재 사용자의 ID. 꼭 같아 보내줘야함
   * @param socket - 연결된 클라이언트 소켓.
   * 중간 콘솔 로그는 데이터 확인용으로 사용
   */
  @SubscribeMessage('new_bid')
  handleNewBid(
    @MessageBody()
    bidData: {
      nickname: string;
      auctionId: string;
      newCurrentBid: number;
      userId: string;
    },
    @ConnectedSocket() socket: Socket,
  ) {
    const { nickname, auctionId, newCurrentBid, userId } = bidData;
    const newBidData = { nickname, newCurrentBid };

    const currentBid = this.auctionCommonService.getCurrentBid(auctionId);

    if (newCurrentBid > currentBid) {
      this.auctionCommonService.setCurrentBid(auctionId, newCurrentBid, userId);
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
