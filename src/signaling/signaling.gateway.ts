import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JoinChannelDto } from './dto/join-channel.dto';
import { RoomService } from 'src/mediasoup/room/room.service';
import { TransportService } from 'src/mediasoup/transport/transport.service';
import { ProducerConsumerService } from 'src/mediasoup/producer-consumer/producer-consumer.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'media',
  path: '/media/socket.io',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class SignalingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger(SignalingGateway.name, { timestamp: true });

  constructor(
    private readonly roomService: RoomService,
    private readonly transportService: TransportService,
    private readonly producerConsumerService: ProducerConsumerService,
  ) {}

  afterInit() {
    this.logger.log(`Server initialized`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  async handleJoinChannel(
    @MessageBody() dto: JoinChannelDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = dto;
    const peerId = client.id;

    try {
      let room = this.roomService.getRoom(roomId);
      if (!room) {
        room = await this.roomService.createRoom(roomId);
        this.logger.log(`New room created: ${roomId}`);
      }
      this.logger.log(
        `New peer joined a room: ${roomId}, roomSize: ${room.peers.size}`,
      );
      const sendTransportOptions =
        await this.transportService.createWebRtcTransport(
          roomId,
          client,
          'send',
        );

      const recvTransportOptions =
        await this.transportService.createWebRtcTransport(
          roomId,
          client,
          'recv',
        );

      client.join(roomId); // Socket.io 룸에 참가

      // 방의 현재 참여자 목록 전송
      const peerIds = Array.from(room.peers.keys());

      // 기존 Producer들의 정보 수집
      const existingProducers = [];
      if (room.sellerSocket) {
        const sellPeer = this.roomService.getPeer(room, room.sellerSocket.id);
        for (const producer of sellPeer.producers.values()) {
          existingProducers.push({
            producerId: producer.producer.id,
            peerId: sellPeer.id,
            kind: producer.producer.kind,
          });
        }
      }

      // client.emit('update-peer-list', { peerIds });

      // 다른 클라이언트들에게 새로운 유저 알림. 우선은 신경 안써도 됨
      client.to(roomId).emit('new-peer', { peerId });

      return {
        isAgreed: room.isSellerAgreed,
        sendTransportOptions,
        recvTransportOptions,
        rtpCapabilities: room.router.router.rtpCapabilities,
        peerIds,
        existingProducers,
      };
    } catch (error) {
      console.error(error);
      client.emit('join-room-error', { error: error.message });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const room = this.roomService.getRoom(roomId);
    if (!room) throw new Error('No such room');

    const closed = this.roomService.closePeerResource(room, client.id);

    if (!closed) return { success: false, error: 'peer is not in a room' };

    if (room.peers.size === 0) {
      this.roomService.removeRoom(roomId);
    }
    this.logger.log(`peer left a room id :${roomId}`);
    client.leave(roomId);
    client.to(roomId).emit('peer-left', { peerId: client.id });
    return { success: true };
  }

  @SubscribeMessage('connect-transport')
  async handleConnectTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody() data,
  ) {
    const { roomId, peerId, dtlsParameters, transportId } = data;
    const room = this.roomService.getRoom(roomId);
    const peer = room?.peers.get(peerId);
    if (!peer) {
      return { error: 'Peer not found' };
    }
    const transportData = peer.transports.get(transportId);
    if (!transportData) {
      return { error: 'Transport not found' };
    }
    await transportData.transport.connect({ dtlsParameters });
    console.log('>> transport connected');

    return { connected: true };
  }

  @SubscribeMessage('produce')
  async handleProduce(@MessageBody() data, @ConnectedSocket() client: Socket) {
    const { roomId, kind, transportId, rtpParameters } = data;
    const peerId = client.id;
    try {
      const producerId = await this.producerConsumerService.createProducer({
        roomId,
        client,
        transportId,
        kind,
        rtpParameters,
      });

      // 다른 클라이언트에게 새로운 Producer 알림
      client.to(roomId).emit('new-producer', { producerId, peerId, kind });

      return { producerId };
    } catch (error) {
      console.error(error);
      client.emit('produce-error', { error: error.message });
    }
  }

  @SubscribeMessage('consume')
  async handleConsume(@MessageBody() data, @ConnectedSocket() client: Socket) {
    const { roomId, producerId, rtpCapabilities, transportId } = data;
    const peerId = client.id;
    try {
      const consumerData = await this.producerConsumerService.createConsumer({
        roomId,
        peerId,
        transportId,
        producerId,
        rtpCapabilities,
      });
      this.logger.log(
        `New consumer created and consuming producerId: ${consumerData.producerId}`,
      );
      return {
        consumerData,
      };
    } catch (error) {
      console.error(error);
      client.emit('consume-error', { error: error.message });
    }
  }

  @SubscribeMessage('stop-prev-producer')
  async handleStopPrevProducer(
    @MessageBody() data,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    console.log(
      '==== stoped room ===: ',
      roomId,
      JSON.stringify(this.roomService.getPrevSeller(roomId)?.id),
    );

    this.server.to(roomId).emit('stop-consumer');
    const prevSellerPeer = this.producerConsumerService.stopSellerPeer({
      roomId,
    });
    if (prevSellerPeer) {
      prevSellerPeer.emit('stop-producer');
      this.logger.debug('---stop seller producer---');
    }
    return true;
  }

  @SubscribeMessage('seller-agreed')
  async handleSellerAgreed(
    @MessageBody() data,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, isAgreed } = data;
    this.logger.debug(`>> seller agreed : ${JSON.stringify(data)}`);
    const room = this.roomService.getRoom(roomId);
    if (!room) throw new Error('No such room');
    this.roomService.setIsAgreed(room, isAgreed);
    this.server.to(roomId).emit('seller-agreed-response', { isAgreed });

    return;
  }

  @SubscribeMessage('seller-disagreed-camera')
  handleSellerDisagreedCamera(
    @MessageBody() data,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    this.logger.debug(`>> seller disagreed camera : ${JSON.stringify(data)}`);
    const room = this.roomService.getRoom(roomId);
    if (!room) throw new Error('No such room');
    this.server
      .to(roomId)
      .emit('seller-disagreed-camera-response', { isAgreed: false });
  }
}
