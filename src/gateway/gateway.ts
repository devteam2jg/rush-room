import { UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from '~/src/domain/auth/guards/auth.guard';
import { AuctionService } from '../domain/auction/auction.service';
import { AuctionGatewayService } from '~/src/gateway/gateway.service';
import { AuctionIds } from '~/src/common/dto/auctionIdsWithJwtPayload';

/**
 * 경매 관련 이벤트를 처리하는 WebSocket 게이트웨이.
 * 네임스페이스 `/auction-execute`를 사용하며 CORS를 허용합니다.
 */
@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
})
@UseGuards(JwtAuthGuard)
export class AuctionGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly auctionService: AuctionService,
    private readonly auctionGatewayService: AuctionGatewayService,
  ) {}

  private currentBids: { [auctionId: string]: number } = {}; // 각 경매의 현재 최고가 저장

  /**
   * 'join_auction' 이벤트를 처리.
   * 클라이언트를 지정된 경매 방에 추가하고 현재 최고 입찰가를 전송.
   *
   * @param socket - 클라이언트 소켓.
   * @param joinData - auctionId, auction
   */
  @SubscribeMessage('join_auction')
  async handleJoinAuction(socket: Socket, joinData: AuctionIds): Promise<void> {
    const { auctionId, auctionItemId } = joinData;
    socket.join(auctionId);
    console.log(`Client ${socket.id} joined auction ${auctionId}`);

    // 1. auctionId와 aucionItemId를 이용해 물품의 startPrice를 가져외서 currentBids에 저장
    const auctionItem = await this.auctionService.getAuctionItem(
      auctionId,
      auctionItemId,
    );
    this.currentBids[auctionId] = auctionItem.startPrice;
    // 2. 경매시간이 지난 후 currentBids[auctionId]를 lastPrice로 업데이트

    if (this.currentBids[auctionId] == null) {
      this.currentBids[auctionId] = 9999999999;
    }

    const currentBid = this.currentBids[auctionId];
    socket.emit('current_bid', currentBid);
    socket.emit('item_info', auctionItem); //
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
    await this.auctionGatewayService.updateItemBidResult(
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

  /**
   * 'message' 이벤트를 처리.
   * 지정된 경매 방의 모든 클라이언트에게 메시지를 전송.
   *
   * @param socket - 클라이언트 소켓.
   * @param data - auctionId, userId, message를 포함한 메시지 데이터.
   */
  @SubscribeMessage('message')
  handleMessage(
    socket: Socket,
    messageData: { auctionId: string; userId: string; message: string, nickname: string },
  ): void {
    const { auctionId } = messageData;
    this.server.to(auctionId).emit('message', messageData);
  }

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
    @MessageBody() bidData: { auctionId: string; newCurrentBid: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const { auctionId, newCurrentBid } = bidData;

    if (newCurrentBid > this.currentBids[auctionId]) {
      this.currentBids[auctionId] = newCurrentBid;
      this.server.to(auctionId).emit('bid_updated', newCurrentBid);
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
   * 음성 데이터 처리
   * 같은 room 사용자 모두에게 전송
   * @param voiceData
   */
  @SubscribeMessage('audio')
  handleAudio(
    @MessageBody() voiceData: { data: Blob; auctionId: string; userId: string },
  ) {
    const { data, auctionId, userId } = voiceData;
    this.server.to(auctionId).emit('audioPlay', data);
    this.server
      .to(auctionId)
      .emit('message', `${userId}님이 음성메세지를 보냈습니다.`);
  }

  /**
   * 새로운 클라이언트 연결을 확인
   * @param socket - 클라이언트 소켓.
   */
  handleConnection(socket: Socket) {
    console.log(`Client connected: ${socket.id}`);
  }

  /**
   * 클라이언트 연결 해제를 확인
   * @param socket - 클라이언트 소켓.
   */
  handleDisconnect(socket: Socket) {
    console.log(`Client disconnected: ${socket.id}`);
  }
}
