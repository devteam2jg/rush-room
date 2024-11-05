import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, forwardRef, Injectable } from '@nestjs/common';
import {
  MessageType,
  ResponseDto,
  UpdateBidPriceDto,
  UserMessageDto,
} from '~/src/domain/game/dto/game.dto';
import { GameService } from '~/src/domain/game/game.service';
// import { AuctionIsRunningGuard } from '~/src/domain/game/guards/auctionId.guards';

@Injectable()
@WebSocketGateway({
  namespace: '/auction-execute',
  cors: { origin: true, credentials: true },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;
  constructor(
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
  ) {}

  sendToMany(response: ResponseDto, data: any): boolean {
    const { auctionId, messageType } = response;
    this.server.to(auctionId).emit(messageType, data);
    return true;
  }
  sendToOne(response: ResponseDto, data: any): boolean {
    const { messageType, socket } = response;
    socket.emit(messageType, data);
    return true;
  }

  /**
   * 'join_auction' 이벤트를 처리.
   * @param socket
   * @param joinData - auctionId, userId 포함한 데이터.
   */
  // @UseGuards(AuctionIsRunningGuard)
  @SubscribeMessage('join_auction')
  async handleJoinAuction(
    socket: Socket,
    joinData: { auctionId: string; userId: string },
  ): Promise<void> {
    const { auctionId, userId } = joinData;

    if (this.gameService.isRunning(auctionId)) {
      socket.join(auctionId);
      await this.gameService.joinAuction(auctionId, userId);
    }
    //this.gameService.loadGame(auctionId, socket);
    console.log(`Client ${socket.id} joined auction ${auctionId}`);
  }

  /**
   * 'message' 이벤트를 처리.
   * 지정된 경매 방의 모든 클라이언트에게 메시지를 전송.
   * @param socket - 클라이언트 소켓.
   * @param messageData - auctionId, userId, message, nickname 포함한 메시지 데이터.
   */
  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket()
    socket: Socket,
    messageData: UserMessageDto,
  ): boolean {
    const { auctionId, userId, message, nickname } = messageData;
    const messageType = MessageType.USER_MESSAGE;
    const data = {
      userId,
      message,
      nickname,
    };
    const response: ResponseDto = {
      auctionId,
      messageType,
      socket,
    };
    this.sendToMany(response, data);
    return true;
  }

  /**
   * 'new_bid' 이벤트를 처리.
   * 새로운 입찰가가 현재 입찰가보다 높으면 현재 입찰가를 업데이트.
   * @param bidData - auctionId, userNickName, bidPrice, bidderId 포함한 입찰 데이터.
   */
  @SubscribeMessage('new_bid')
  handleNewBid(
    @ConnectedSocket()
    socket: Socket,
    @MessageBody()
    bidData: UpdateBidPriceDto,
  ): any {
    return this.gameService.updateBidPrice(bidData);
  }

  @SubscribeMessage('INFO')
  handleRequestAuctionInfo(
    @MessageBody() data: { auctionId: string; type?: string },
  ) {
    const { auctionId } = data;
    return this.gameService.requestAuctionInfo(auctionId);
  }

  /**
   * 음성 데이터 처리
   * 같은 room 사용자 모두에게 전송
   * @param socket
   * @param voiceData
   */
  @SubscribeMessage('audio')
  handleAudio(
    socket: Socket,
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
    const type = MessageType.USER_MESSAGE;
    const messageData = { auctionId, type, userId, nickname, message };
    this.sendToMany({ auctionId, messageType: type, socket }, { data });
    this.sendToMany(
      { auctionId, messageType: MessageType.VOICE_MESSAGE, socket },
      messageData,
    );
  }
}
