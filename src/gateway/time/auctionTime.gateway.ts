import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class AuctionTimeGateway {
  /**
   * 'server_time' 이벤트를 처리.
   * 현재 서버 시간을 클라이언트에 전송.
   *
   * @param socket - 클라이언트 소켓.
   */
  @SubscribeMessage('server_time')
  handleServerTime(@ConnectedSocket() socket: Socket): void {
    const serverTime = new Date();
    socket.emit('server_time', serverTime);
  }
}
