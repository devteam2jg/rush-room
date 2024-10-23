import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
}) // 특정 namespace를 경매용으로 사용
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
    console.log('auction id ======', auctionId);
    socket.join(auctionId); // 해당 경매방에 소켓을 참여시킴

    // defualt 가격
    if (this.currentBids[auctionId] == null) {
      this.currentBids[auctionId] = 50000;
    }
    const currentBid = this.currentBids[auctionId]; // 설정되지 않은 경우 50000으로 초기화
    // 해당 경매의 현재 최고가를 전송
    socket.emit('current_bid', currentBid);
  }

  // 새로운 가격 제시
  @SubscribeMessage('new_bid')
  handleNewBid(
    @MessageBody() bidData: { auctionId: string; newCurrentBid: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const { auctionId, newCurrentBid } = bidData;

    // 콘솔, 데이터 확인
    console.log('bidData ======', bidData);
    console.log('newCurrentBid ==== ', newCurrentBid);
    console.log(
      'this.currentBids[auctionId] === ',
      this.currentBids[auctionId],
    );
    console.log('condition ==== ', newCurrentBid > this.currentBids[auctionId]);

    // 현재 최고가보다 높은 금액만 허용
    if (newCurrentBid > this.currentBids[auctionId]) {
      this.currentBids[auctionId] = newCurrentBid; // 최고가 업데이트
      // 해당 경매방의 모든 사용자에게 새로운 최고가 알림
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
}
