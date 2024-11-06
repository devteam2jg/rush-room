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
  namespace: 'sfu',
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

  private logger = new Logger('SignalingGateway', { timestamp: true });

  constructor(
    private readonly roomService: RoomService,
    private readonly transportService: TransportService,
    private readonly producerConsumerService: ProducerConsumerService,
  ) {}

  afterInit() {
    console.log(`Server initialized`);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  async handleJoinChannel(
    @MessageBody() dto: JoinChannelDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, peerId } = dto;

    try {
      let room = this.roomService.getRoom(roomId);
      if (!room) {
        room = await this.roomService.createRoom(roomId);
        this.logger.log(`New room created: ${roomId}`);
      }
      const sendTransportOptions =
        await this.transportService.createWebRtcTransport(
          roomId,
          peerId,
          'send',
        );

      const recvTransportOptions =
        await this.transportService.createWebRtcTransport(
          roomId,
          peerId,
          'recv',
        );

      client.join(roomId); // Socket.io 룸에 참가

      // 방의 현재 참여자 목록 전송
      const peerIds = Array.from(room.peers.keys());

      // 기존 Producer들의 정보 수집
      const existingProducers = [];
      for (const [otherPeerId, peer] of room.peers) {
        if (otherPeerId !== peerId) {
          for (const producer of peer.producers.values()) {
            existingProducers.push({
              producerId: producer.producer.id,
              peerId: otherPeerId,
              kind: producer.producer.kind,
            });
          }
        }
      }

      // client.emit('update-peer-list', { peerIds });

      // 다른 클라이언트들에게 새로운 유저 알림. 우선은 신경 안써도 됨
      client.to(roomId).emit('new-peer', { peerId });

      return {
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
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const rooms = Array.from(client.rooms);

    for (const roomId of rooms) {
      if (roomId !== client.id) {
        const room = this.roomService.getRoom(roomId);
        if (room) {
          const peer = room.peers.get(client.id);
          if (peer) {
            // Close all producers
            for (const producer of peer.producers.values()) {
              producer.producer.close();
            }
            // Close all consumers
            for (const consumer of peer.consumers.values()) {
              consumer.consumer.close();
            }
            // Close all transports
            for (const transport of peer.transports.values()) {
              transport.transport.close();
            }
            room.peers.delete(client.id);
          }
          client.leave(roomId);
          client.to(roomId).emit('peer-left', { peerId: client.id });
          if (room.peers.size === 0) {
            this.roomService.removeRoom(roomId);
          }
        }
      }
    }
    return { left: true };
  }

  @SubscribeMessage('connect-transport')
  async handleConnectTransport(@MessageBody() data) {
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
    const { auctionId, peerId, kind, transportId, rtpParameters } = data;
    try {
      const producerId = await this.producerConsumerService.createProducer({
        auctionId,
        peerId,
        transportId,
        kind,
        rtpParameters,
      });
      this.logger.debug(`New producer created: ${producerId}`);
      // 다른 클라이언트에게 새로운 Producer 알림
      client.to(auctionId).emit('new-producer', { producerId, peerId, kind });

      return { producerId };
    } catch (error) {
      console.error(error);
      client.emit('produce-error', { error: error.message });
    }
  }

  @SubscribeMessage('consume')
  async handleConsume(@MessageBody() data, @ConnectedSocket() client: Socket) {
    const { auctionId, peerId, producerId, rtpCapabilities, transportId } =
      data;
    try {
      const consumerData = await this.producerConsumerService.createConsumer({
        auctionId,
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
  async handleStopPrevProducer(@MessageBody() data) {
    const { auctionId } = data;
    const prevSellerPeerId = this.producerConsumerService.stopSellerPeer({
      auctionId,
    });
    if (prevSellerPeerId) {
      this.server.to(prevSellerPeerId).emit('stop-producer');
    }
    return { prevSellerPeerId };
  }
}
