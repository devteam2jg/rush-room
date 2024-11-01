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

@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
})
// @UseGuards(JwtAuthGuard)
export class AuctionItemBidGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly auctionItemBidService: AuctionItemBidService,
    private readonly auctionService: AuctionService,
  ) {}

  private currentBids: { [auctionId: string]: number } = {}; // 각 경매의 현재 최고가 저장

  /**
   * `new_bid` 이벤트를 처리.
   * 새로운 입찰가가 현재 입찰가보다 높으면 현재 입찰가를 업데이트.
   *
   * @param bidData - 경매 ID와 새로운 입찰 금액을 포함한 데이터.
   * @param socket - 연결된 클라이언트 소켓.
   * 중간 콘솔 로그는 데이터 확인용으로 사용
   */
  @SubscribeMessage('new_bid')
  handleNewBid(
    @MessageBody()
    bidData: { nickname: string; auctionId: string; newCurrentBid: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const { nickname, auctionId, newCurrentBid } = bidData;
    const newBidData = { nickname, newCurrentBid };

    if (newCurrentBid > this.currentBids[auctionId]) {
      this.currentBids[auctionId] = newCurrentBid;
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
    finishData: AuctionIds,
  ): Promise<void> {
    const { auctionId, auctionItemId } = finishData;
    const lastPrice = this.currentBids[auctionId];

    const updateAuctionItemDto = { lastPrice }; // Assuming lastPrice is part of the DTO
    await this.auctionItemBidService.updateItemBidResult(
      auctionItemId,
      updateAuctionItemDto,
    );
  }

  /**
   * 'next_Item' 이벤트를 처리.
   *
   * @param socket
   * @param nextItemData - auctionId, auctionItemId
   */
  @SubscribeMessage('next_item')
  async handleNextItem(
    socket: Socket,
    nextItemData: AuctionIds,
  ): Promise<void> {
    const { auctionId, auctionItemId } = nextItemData;
    const auctionItem = await this.auctionService.getAuctionItem(
      auctionId,
      auctionItemId,
    );
    this.currentBids[auctionId] = auctionItem.startPrice;
    const currentBid = this.currentBids[auctionId];

    socket.emit('current_bid', currentBid);
    socket.emit('item_info', auctionItem);
  }
}
