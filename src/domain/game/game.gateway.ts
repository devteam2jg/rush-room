import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { Injectable } from '@nestjs/common';
import { ResponseDto } from '~/src/domain/game/dto/game.dto';

@Injectable()
@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  sendToGame(response: ResponseDto): boolean {
    const { auctionId, messageType, ...result } = response;
    this.server.to(auctionId).emit(messageType, result);
    return true;
  }
}
