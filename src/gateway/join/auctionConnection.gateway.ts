import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuctionService } from '../../domain/auction/auction.service';
import { AuctionIds } from '~/src/common/dto/auctionIdsWithJwtPayload';
import { AuctionCommonService } from '~/src/gateway/auctionCommon.service';
import { AuctionConnectionService } from '~/src/gateway/join/auctionConnection.service';

/**
 * 경매 관련 이벤트를 처리하는 WebSocket 게이트웨이.
 * 네임스페이스 `/auction-execute`를 사용하며 CORS를 허용.
 */
@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
})
export class AuctionConnectionGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly auctionService: AuctionService,
    private readonly gatewayCommonService: AuctionCommonService,
    private readonly auctionConnectionService: AuctionConnectionService,
  ) {}

  /**
   * 'join_auction' 이벤트를 처리.
   * 클라이언트를 지정된 경매 방에 추가하고 현재 최고 입찰가를 전송.
   *
   * @param socket - 클라이언트 소켓.
   * @param joinData - auctionId, auction
   */
  @SubscribeMessage('join_auction')
  async handleJoinAuction(socket: Socket, joinData: AuctionIds): Promise<void> {
    const currentBid = this.auctionConnectionService.handleJoinInfo(
      socket,
      joinData,
    );
    socket.emit('current_bid', currentBid);
  }

  /**
   * 'leave_auction' 이벤트를 처리.
   * 클라이언트를 지정된 경매 방에서 제거.
   *
   * @param socket - 클라이언트 소켓.
   * @param auctionId - 경매 방 ID.
   */
  @SubscribeMessage('leave_auction')
  handleLeaveAuction(socket: Socket, auctionId: string): void {
    socket.leave(auctionId);
    console.log(`Client ${socket.id} left auction ${auctionId}`);
  }
}
