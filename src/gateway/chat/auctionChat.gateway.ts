import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
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
export class AuctionChatGateway {
  @WebSocketServer()
  server: Server;

  constructor() {}

  /**
   * 'message' 이벤트를 처리.
   * 지정된 경매 방의 모든 클라이언트에게 메시지를 전송.
   *
   * @param socket - 클라이언트 소켓.
   * @param messageData - auctionId, userId, message를 포함한 메시지 데이터.
   */
  @SubscribeMessage('message')
  handleMessage(
    socket: Socket,
    messageData: {
      auctionId: string;
      userId: string;
      message: string;
      nickname: string;
    },
  ): void {
    const { auctionId } = messageData;
    this.server.to(auctionId).emit('message', messageData);
  }

  /**
   * 음성 데이터 처리
   * 같은 room 사용자 모두에게 전송
   * @param voiceData
   */
  @SubscribeMessage('audio')
  handleAudio(
    @MessageBody()
    voiceData: {
      data: Blob;
      userId: string;
      auctionId: string;
      nickname: string;
    },
  ) {
    const { data, auctionId, userId, nickname } = voiceData;
    const message = `${nickname}님이 음성메세지를 보냈습니다.`;
    const messageData = { auctionId, userId, nickname, message };
    this.server.to(auctionId).emit('audioPlay', data);
    this.server.to(auctionId).emit('message', messageData);
  }
}
