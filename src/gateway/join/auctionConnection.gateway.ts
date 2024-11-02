import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuctionCommonService } from '~/src/gateway/auctionCommon.service';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { AuctionIds } from '~/src/common/dto/auctionIdsWithJwtPayload';

/**
 * 경매 관련 이벤트를 처리하는 WebSocket 게이트웨이.
 * 이 게이트웨이는 '/auction-execute' 네임스페이스에서 작동.
 */
@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
})
export class AuctionConnectionGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly auctionCommonService: AuctionCommonService,
    private readonly auctionService: AuctionService,
  ) {}

  /**
   * 'join_auction' 이벤트를 처리.
   * 클라이언트를 지정된 경매 방에 추가하고 현재 최고 입찰가를 전송.
   *
   * @param socket - 클라이언트 소켓.
   * @param joinData - AuctionIds : auctionId, auction
   */
  @SubscribeMessage('join_auction')
  async handleJoinAuction(socket: Socket, joinData: AuctionIds): Promise<void> {
    const { auctionId, auctionItemId } = joinData;
    socket.join(auctionId);
    console.log(`Client ${socket.id} joined auction ${auctionId}`);

    const auctionItem = await this.auctionService.getAuctionItem(
      auctionId,
      auctionItemId,
    );

    const startPrice = auctionItem.startPrice;

    if (!this.auctionCommonService.getCurrentBid(auctionId)) {
      this.auctionCommonService.setCurrentBid(auctionId, startPrice, null);
    }

    const currentBid = this.auctionCommonService.getCurrentBid(auctionId);
    socket.emit('current_bid', currentBid);
  }
}
