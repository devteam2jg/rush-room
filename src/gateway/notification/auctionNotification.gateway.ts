import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuctionNotificationService } from './auctionNotification.service';

/**
 * 경매 관련 공지 메세지 이벤트 처리 기능
 */
@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
})
export class AuctionNotificationGateway {
  @WebSocketServer() server: Server;

  constructor(
    private readonly auctionNotificationService: AuctionNotificationService,
  ) {}

  @SubscribeMessage('auctionStart')
  handleStartNotification(@MessageBody() message: string) {
    this.auctionNotificationService.notifyAuctionStart(message);
  }

  @SubscribeMessage('auctionEnd')
  handleEndNotification(@MessageBody() message: string) {
    this.auctionNotificationService.notifyAuctionEnd(message);
  }

  @SubscribeMessage('highestBid')
  handleHighestBidNotification(
    @MessageBody()
    bidData: {
      auctionId: string;
      username: string;
      newBidAmount: number;
    },
  ) {
    this.auctionNotificationService.notifyHighestBidUpdate(bidData);
  }

  @SubscribeMessage('auctionTimeExtended')
  handleTimeExtendedNotification(@MessageBody() message: string) {
    this.auctionNotificationService.notifyAuctionTimeExtended(message);
  }
}
