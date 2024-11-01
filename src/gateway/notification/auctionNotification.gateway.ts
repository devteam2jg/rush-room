import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuctionNotificationService } from './auctionNotification.service';

@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
})
export class AuctionNotificationGateway {
  @WebSocketServer() server: Server;

  constructor(
    private readonly auctionNotificationService: AuctionNotificationService,
  ) {}

  @SubscribeMessage('sendNotification')
  handleNotification(@MessageBody() message: string) {}
}
