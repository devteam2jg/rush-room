import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * 경매 관련 이벤트를 처리하는 WebSocket 게이트웨이.
 * 네임스페이스 `/auction-execute`를 사용하며 CORS를 허용합니다.
 */
@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
})
export class AuctionGateway {
  @WebSocketServer()
  server: Server;

  private currentBids: { [auctionId: string]: number } = {}; // 각 경매의 현재 최고가 저장

  /**
   * 'join_auction' 이벤트를 처리.
   * 클라이언트를 지정된 경매 방에 추가하고 현재 최고 입찰가를 전송.
   *
   * @param socket - 클라이언트 소켓.
   * @param auctionId - 참여할 경매 방의 ID.
   */
  @SubscribeMessage('join_auction')
  handleJoinAuction(socket: Socket, auctionId: string): void {
    socket.join(auctionId);
    console.log(`Client ${socket.id} joined auction ${auctionId}`);

    // TODO: 각 물품 startPrice 조회 lastPrice 저장 기능 추가
    // 1. auctionId와 aucionItemId를 이용해 물품의 startPrice를 가져외서 currentBids에 저장
    // 2. 경매시간이 지난 후 currentBids[auctionId]를 lastPrice로 업데이트
    // 3. 다음 등록된 물품을 조회해서 위의과정을 반복하는 로직 완성

    if (this.currentBids[auctionId] == null) {
      this.currentBids[auctionId] = 50000;
    }

    const currentBid = this.currentBids[auctionId];
    socket.emit('current_bid', currentBid);
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
