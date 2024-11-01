import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuctionService } from '../../domain/auction/auction.service';
import { AuctionIds } from '~/src/common/dto/auctionIdsWithJwtPayload';

/**
 * 경매 관련 이벤트를 처리하는 WebSocket 게이트웨이.
 * 네임스페이스 `/auction-execute`를 사용하며 CORS를 허용.
 */
@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
})
export class AuctionJoinGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly auctionService: AuctionService) {}

  private currentBids: { [auctionId: string]: number } = {};

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

    //servcie
    const auctionItem = await this.auctionService.getAuctionItem(
      auctionId,
      auctionItemId,
    );

    const currentPrice = this.currentBids[auctionId];
    const itemStartPrice = auctionItem.startPrice;

    if (currentPrice == null) {
      this.currentBids[auctionId] = itemStartPrice;
    }

    const currentBid = this.currentBids[auctionId];
    socket.emit('current_bid', currentBid);
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
