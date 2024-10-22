import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/auction-execute' }) // 특정 namespace를 경매용으로 사용
export class AuctionGateway {
  @WebSocketServer()
  server: Server;

  private currentBids: { [auctionId: string]: number } = {}; // 각 경매의 현재 최고가 저장

  // 경매방에 참여
  @SubscribeMessage('join_auction')
  handleJoinAuction(
    @MessageBody() auctionId: string, // 경매 ID
    @ConnectedSocket() socket: Socket,
  ) {
    socket.join(auctionId); // 해당 경매방에 소켓을 참여시킴
    const currentBid = this.currentBids[auctionId] || 0; // 설정되지 않은 경우 0으로 초기화
    // 해당 경매의 현재 최고가를 전송
    socket.emit('current_bid', currentBid);
  }

  // 새로운 가격 제시
  @SubscribeMessage('new_bid')
  handleNewBid(
    @MessageBody() bidData: { auctionId: string; bidAmount: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const { auctionId, bidAmount } = bidData;

    // 현재 최고가보다 높은 금액만 허용
    if (bidAmount > (this.currentBids[auctionId] || 0)) {
      this.currentBids[auctionId] = bidAmount; // 최고가 업데이트
      // 해당 경매방의 모든 사용자에게 새로운 최고가 알림
      this.server.to(auctionId).emit('bid_updated', bidAmount);
      console.log(`Auction ${auctionId} has a new highest bid: ${bidAmount}`);
    } else {
      socket.emit(
        'bid_error',
        'Bid must be higher than the current highest bid.',
      );
    }
  }
}
