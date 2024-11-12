import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, Injectable, UseGuards } from '@nestjs/common';
import {
  MessageType,
  RequestDto,
  ResponseDto,
  UpdateBidPriceDto,
  UserMessageDto,
} from '~/src/domain/game/dto/game.dto';
import { GameService } from '~/src/domain/game/services/game.service';
import { GameGuard } from '~/src/domain/game/guards/game.guard';
import { JoinAuctionDto } from '~/src/domain/game/dto/join.auction.dto';
import { GameStatusService } from '~/src/domain/game/services/game.status.service';

@Injectable()
@WebSocketGateway({
  namespace: 'game',
  path: '/game/socket.io',
  cors: { origin: true, credentials: true },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;
  constructor(
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
    private readonly gameStatusService: GameStatusService,
  ) {}

  sendToMany(response: ResponseDto, data: any): boolean {
    const { auctionId, messageType } = response;
    this.server.to(auctionId).emit(messageType, data);
    return true;
  }
  sendToOne(response: ResponseDto, data: any): boolean {
    const { messageType, socketId } = response;
    this.server.to(socketId).emit(messageType, data);
    return true;
  }

  /**
   * 'join_auction' 이벤트를 처리.
   * @param socket
   * @param joinData - auctionId, userId 포함한 데이터.
   */
  @UseGuards(GameGuard)
  @SubscribeMessage('JOIN')
  async handleJoinAuction(
    @ConnectedSocket() socket: Socket,
    @MessageBody() joinData: JoinAuctionDto,
  ): Promise<{ message: string }> {
    const { auctionId } = joinData;
    if (this.gameStatusService.isRunning(auctionId)) {
      socket.join(auctionId);
      await this.gameService.joinAuction(socket, joinData);
      return {
        message: 'success',
      };
    }
    return {
      message: 'fail',
    };
  }

  /**
   * 'message' 이벤트를 처리.
   * 지정된 경매 방의 모든 클라이언트에게 메시지를 전송.
   * @param socket - 클라이언트 소켓.
   * @param messageData - auctionId, userId, message, nickname 포함한 메시지 데이터.
   */

  @UseGuards(GameGuard)
  @SubscribeMessage(MessageType.USER_MESSAGE)
  handleMessage(
    @ConnectedSocket()
    socket: Socket,
    @MessageBody()
    messageData: UserMessageDto,
  ): boolean {
    const { auctionId, userId, message, nickname } = messageData;
    const socketId = socket.id;
    const messageType = MessageType.USER_MESSAGE;
    const data = {
      auctionId,
      userId,
      message,
      nickname,
    };
    const response: ResponseDto = {
      auctionId,
      messageType,
      socketId,
    };
    this.sendToMany(response, data);
    return true;
  }

  /**
   * 'new_bid' 이벤트를 처리.
   * 새로운 입찰가가 현재 입찰가보다 높으면 현재 입찰가를 업데이트.
   * @param bidData - auctionId, userNickName, bidPrice, bidderId 포함한 입찰 데이터.
   */

  @UseGuards(GameGuard)
  @SubscribeMessage('new_bid')
  handleNewBid(
    @ConnectedSocket()
    socket: Socket,
    @MessageBody()
    bidData: UpdateBidPriceDto,
  ): any {
    bidData.socketId = socket.id;
    return this.gameService.updateBidPrice(bidData);
  }

  @UseGuards(GameGuard)
  @SubscribeMessage('CONTEXT')
  handleRequestAuctionInfo(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: RequestDto,
  ) {
    const { type } = data;
    if (!data.socketId) data.socketId = socket.id;
    console.log('Context 요청', data);
    switch (type) {
      case 'INFO':
        return this.gameService.requestAuctionInfo(data);
      case 'MODAL':
        return this.gameService.requestLastNotifyData(data);
      case 'CAMERA':
        console.log('카메라 요청');
        return this.gameService.requestCamera(data);
      case 'OWNER':
        return this.gameService.requestOwnerInfo(data);
    }
  }

  /**
   * 음성 데이터 처리
   * 같은 room 사용자 모두에게 전송
   * @param socket
   * @param voiceData
   */

  // @UseGuards(GameGuard)
  // @SubscribeMessage('audio')
  // handleAudio(
  //   socket: Socket,
  //   @MessageBody()
  //   voiceData: {
  //     data: Blob;
  //     userId: string;
  //     auctionId: string;
  //     nickname: string;
  //   },
  // ) {
  //   const { data, auctionId, userId, nickname } = voiceData;
  //   const message = `${nickname}님이 음성메세지를 보냈습니다.`;
  //   const type = MessageType.USER_MESSAGE;
  //   const messageData = { auctionId, type, userId, nickname, message };
  //   this.sendToMany({ auctionId, messageType: type, socket }, { data });
  //   this.sendToMany(
  //     { auctionId, messageType: MessageType.VOICE_MESSAGE, socket },
  //     messageData,
  //   );
  // }
}
