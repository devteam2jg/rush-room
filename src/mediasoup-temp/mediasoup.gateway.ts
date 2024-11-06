import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MediasoupService } from './mediasoup.service';
import { RoomState } from '~/src/mediasoup-temp/mediasoup.types';
import { MediaKind } from 'mediasoup/node/lib/RtpParameters';
import { Logger } from '@nestjs/common';
import { ProducerScore } from 'mediasoup/node/lib/Producer';
import { SctpStreamParameters } from 'mediasoup/node/lib/SctpParameters';

@WebSocketGateway({
  namespace: 'sfu',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class MediaSoupGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, RoomState> = new Map(); // { auctionId: RoomState }
  private readonly logger = new Logger('MediasoupGateway', { timestamp: true });

  constructor(private readonly mediasoupService: MediasoupService) {}

  // 예약 함수. web socket server 실행 이후 수행되는 함수. OnGatewayInit
  async afterInit(server: Server) {
    await this.mediasoupService.onModuleInit();
    this.logger.log('Mediasoup gateway initialized');
  }

  // client 측에서 socket.on('connect')에 대응. on GatewayConnection
  async handleConnection(client: Socket) {
    this.logger.warn(`Client connected: ${client.id}`);
    // 클라이언트의 'connect' 이벤트에 대응하는 코드 작성
    client.emit('connected', { message: 'Welcome client!' });
  }

  // client 측에서 socket.on('disconnect')에 대응. on GatewayDisconnect
  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    // 모든 룸에서 피어 찾아서 정리
    /*
    for (const room of this.rooms.values()) {
      // Producer 정리
      this.handleProducerClose(room);
      const peer = room.peers.get(client.id);
      if (peer) {
        // Consumer 정리
        for (const consumerId of peer.consumerIds) {
          const consumer = room.consumers.get(consumerId);
          if (consumer) {
            consumer.close();
            room.consumers.delete(consumerId);
          }
        }

        // Transport 정리
        for (const [transportId, transport] of room.transports.entries()) {
          if (transport.appData.clientId === client.id) {
            transport.close();
            room.transports.delete(transportId);
          }
        }

        room.peers.delete(client.id);
      }
    }
    */
  }
  @SubscribeMessage('createRoom')
  async handleCreateRoom(@MessageBody() { auctionId }) {
    this.logger.verbose(`----Create room: ${auctionId}`);
    try {
      if (!this.rooms.has(auctionId)) {
        const router = await this.mediasoupService.createRouter();
        this.rooms.set(auctionId, {
          router,
          roomId: '',
          sellingProducer: null,
          consumers: new Map(),
          transports: new Map(),
          peers: new Map(),
        });
      }
      return { success: true };
    } catch (error) {
      console.error('Create room error:', error);
      return { error: 'Failed to create room' };
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() { roomId, userId }: { roomId: string; userId: string },
  ) {
    this.logger.verbose(
      `1. Join room: ${roomId} by ${userId}. Creating Rtpcapabilities...`,
    );
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // 피어 정보 저장
      room.peers.set(client.id, {
        userId,
        socket: client,
        consumerIds: new Set(),
      });

      client.join(roomId); // server에 등록
      room.roomId = roomId;

      // 룸의 RTP Capabilities 반환
      return room.router.rtpCapabilities;
    } catch (error) {
      console.error('Join error:', error);
      return { error: 'Failed to join room' };
    }
  }

  @SubscribeMessage('createTransport')
  async handleCreateProducerTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    { roomId, isProducer }: { roomId: string; isProducer: boolean },
  ) {
    try {
      this.logger.verbose(
        `2. ${isProducer ? 'Producer' : 'Consumer'} Create transport: ${roomId}`,
      );
      const room = this.rooms.get(roomId);
      if (!room) throw new Error('Room not found');

      const transport = await this.mediasoupService.createWebRtcTransport(
        room.router,
      );
      room.transports.set(transport.id, transport);

      transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'closed')
          this.logger.debug(
            `Client dtls disconnected: ${client.id}, isProducer: ${isProducer}`,
          );

        if (dtlsState === 'connecting')
          this.logger.debug(
            `Client dtls connecting: ${client.id}, isProducer: ${isProducer}`,
          );
        if (dtlsState === 'connected')
          this.logger.debug(
            `Client dtls connected: ${client.id}, isProducer: ${isProducer}`,
          );
        if (dtlsState === 'failed')
          this.logger.debug(
            `Client dtls failed: ${client.id}, isProducer: ${isProducer}`,
          );
        if (dtlsState === 'new')
          this.logger.debug(
            `Client dtls new: ${client.id}, isProducer: ${isProducer}`,
          );
      });

      transport.on('@close', () => {
        this.logger.debug(`Client closed: ${client.id}`);
      });

      transport.on('icestatechange', (iceState) => {
        if (iceState === 'closed')
          this.logger.debug(
            `Client ice disconnected: ${client.id}, isProducer: ${isProducer}`,
          );
        if (iceState === 'connected')
          this.logger.debug(
            `Client ice connected: ${client.id}, isProducer: ${isProducer}`,
          );
        if (iceState === 'completed')
          this.logger.debug(
            `Client ice completed: ${client.id}, isProducer: ${isProducer}`,
          );
        if (iceState === 'new')
          this.logger.debug(
            `Client ice new: ${client.id}, isProducer: ${isProducer}`,
          );
      });

      // 클라이언트에 transport 정보 반환
      return {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };
    } catch (error) {
      console.error('Create producer transport error:', error);
      return { error: 'Failed to create producer transport' };
    }
  }

  @SubscribeMessage('connectTransport')
  async handleConnectProducerTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    {
      transportId,
      dtlsParameters,
      roomId,
    }: { transportId: string; dtlsParameters: any; roomId: string },
  ) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) throw new Error('Room not found');

      const transport = room.transports.get(transportId);
      if (!transport) throw new Error('Transport not found');

      this.logger.log(
        `c-2-pre1. Connect transport: ${transportId}, dtls: ${transport.appData}`,
      );
      await transport.connect({ dtlsParameters });
      return { success: true, message: '제발' };
    } catch (error) {
      this.logger.error('Connect producer transport error:', error);
      return;
    }
  }

  @SubscribeMessage('produce')
  async handleProduce(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    {
      transportId,
      kind,
      rtpParameters,
      roomId,
    }: {
      transportId: string;
      kind: MediaKind;
      rtpParameters: any;
      roomId: string;
    },
  ) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) throw new Error('Room not found');

      const transport = room.transports.get(transportId);
      if (!transport) throw new Error('Transport not found');

      const producer = await transport.produce({ kind, rtpParameters });
      room.sellingProducer = producer;
      producer.on('score', (scores: ProducerScore[]) => {
        scores.forEach((score) => {
          this.logger.log(`produce rtp score is ${score.score}`);
        });
      });

      this.logger.verbose(`4. Producer created: ${producer.id}`);
      // 새로운 producer를 다른 모든 피어에게 알림. TODO: 'produce'가 client 측에서 2번 실행됨!!
      this.notifyNewProducer(room, producer.id, client.id);

      return { id: producer.id };
    } catch (error) {
      this.logger.error('Produce error:', error);
      return { success: false, message: 'Failed to produce' };
    }
  }

  @SubscribeMessage('consume')
  async handleConsume(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    {
      roomId,
      rtpCapabilities,
      transportId,
    }: {
      roomId: string;
      transportId: string;
      rtpCapabilities: any;
    },
  ) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) throw new Error('Room not found');
      this.logger.verbose(`4. consume: ${roomId}, ${transportId}`);
      const producer = room.sellingProducer;
      if (!producer) throw new Error('Producer not found');

      // Consumer용 transport 찾기
      const transport = room.transports.get(transportId);
      if (!transport) throw new Error('Transport not found');

      // Consumer 생성 가능 여부 확인
      if (
        !room.router.canConsume({
          producerId: producer.id,
          rtpCapabilities,
        })
      ) {
        throw new Error('Cannot consume');
      }

      // Consumer 생성
      const consumer = await transport.consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: true,
      });

      room.consumers.set(consumer.id, consumer);
      this.logger.verbose(
        `5. Consumer created: ${consumer.id} --- kind: ${consumer.kind}`,
      );
      const peer = room.peers.get(client.id);
      if (peer) {
        peer.consumerIds.add(consumer.id);
      }

      consumer.on('transportclose', () => {
        this.handleProducerClose(room);
      });

      consumer.on('producerclose', () => {
        // Producer가 닫힐 때 Consumer 정리
        this.handleProducerClose(room);
      });

      return {
        id: consumer.id,
        producerId: producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      };
    } catch (error) {
      console.error('Consume error:', error);
      return { error: 'Failed to consume' };
    }
  }

  private async notifyNewProducer(
    room: RoomState,
    producerId: string,
    excludeSocketId: string,
  ) {
    this.logger.verbose(`Notifying New producer: ${producerId}`);
    // 다른 모든 피어에게 새 producer 알림
    for (const [socketId, peer] of room.peers.entries()) {
      if (socketId !== excludeSocketId) {
        peer.socket.emit('newProducer', {
          producerId,
        });
      }
    }
  }

  private async handleProducerClose(room: RoomState) {
    const producer = room.sellingProducer;
    if (!producer) return;
    const producerId = producer.id;

    // Producer 관련 모든 Consumer 찾아서 정리
    for (const [consumerId, consumer] of room.consumers.entries()) {
      if (consumer.producerId === producerId) {
        consumer.close();
        room.consumers.delete(consumerId);

        // Consumer의 소유자 찾아서 알림
        for (const [socketId, peer] of room.peers.entries()) {
          if (peer.consumerIds.has(consumerId)) {
            peer.consumerIds.delete(consumerId);
            peer.socket.emit('consumerClosed', { consumerId, producerId });
          }
        }
      }
    }

    // Producer 정리
    room.sellingProducer = null;

    // Producer의 소유자 찾아서 producerIds에서 제거
  }
  @SubscribeMessage('consumeReady')
  async handleConsumeReady(@MessageBody() { roomId }: { roomId: string }) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) throw new Error('Room not found');

      const producerId = room.sellingProducer.id;
      this.logger.verbose(`3. Get producers: ${producerId}`);
      this.server.to(roomId).emit('setNewProducer', { producerId });
    } catch (error) {
      this.logger.error('Get producers error:', error);
    }
  }
  @SubscribeMessage('getProducers')
  async handleGetProducers(@MessageBody() { roomId }: { roomId: string }) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) throw new Error('Room not found');

      const produceId = room.sellingProducer.id;
      this.logger.verbose(`3. Get producers: ${produceId}`);
      return { produceId };
    } catch (error) {
      console.error('Get producers error:', error);
      return { error: 'Failed to get producers' };
    }
  }

  // consumerResume 핸들러
  @SubscribeMessage('consumerResume')
  async handleConsumerResume(
    @ConnectedSocket() client: Socket,
    @MessageBody() { consumerId }: { consumerId: string },
  ) {
    try {
      // 모든 room을 순회하며 해당 consumer 찾기
      for (const room of this.rooms.values()) {
        const consumer = room.consumers.get(consumerId);
        this.logger.log(`consumerResume: ${consumer}`);
        if (consumer) {
          // consumer가 현재 paused 상태인지 확인
          if (consumer.paused) {
            await consumer.resume();
            this.logger.verbose(`Consumer ${consumerId} resumed`);
          }

          // producer의 상태도 확인
          const producer = room.sellingProducer;
          if (producer && !producer.paused) {
            // producer가 활성화 상태라면 다른 peers에게 알림
            this.server.to(room.roomId).emit('consumerResumed', { consumerId });
          }

          break; // consumer를 찾았으므로 순회 중단
        }
      }
    } catch (error) {
      this.logger.error('handleConsumerResume error:', error);
      throw error;
    }
  }
  @SubscribeMessage('produceData')
  async handleProduceData(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    {
      transportId,
      sctpStreamParameters,
      label,
      protocol,
      roomId,
    }: {
      transportId: string;
      sctpStreamParameters: SctpStreamParameters;
      label: string;
      protocol: string;
      roomId: string;
    },
  ) {
    try {
      this.logger.debug(`Produce data request for room: ${roomId}`);

      // 1. 해당 room 찾기
      const room = this.rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // 2. transport 찾기
      const transport = room.transports.get(transportId);
      if (!transport) {
        throw new Error('Transport not found');
      }

      // 3. DataProducer 생성
      const dataProducer = await transport.produceData({
        sctpStreamParameters,
        label,
        protocol,
        appData: { clientId: client.id },
      });

      // 4. DataProducer 이벤트 핸들링
      dataProducer.on('transportclose', () => {
        this.logger.debug(`DataProducer transport closed: ${dataProducer.id}`);
        // cleanup 로직 추가
      });

      dataProducer.on('@close', () => {
        this.logger.debug(`DataProducer closed: ${dataProducer.id}`);
        // cleanup 로직 추가
      });

      // 5. Room state에 dataProducer 저장 (필요한 경우)
      if (!room.dataProducers) {
        room.dataProducers = new Map();
      }
      room.dataProducers.set(dataProducer.id, dataProducer);

      // 6. 다른 피어들에게 새로운 dataProducer 알림 (필요한 경우)
      this.notifyNewDataProducer(room, dataProducer.id, client.id);

      this.logger.verbose(`Data producer created: ${dataProducer.id}`);

      // 7. ID 반환
      return { id: dataProducer.id };
    } catch (error) {
      this.logger.error('Produce data error:', error);
      throw error;
    }
  }

  // 필요한 경우 다른 피어들에게 알림을 보내는 helper 함수
  private notifyNewDataProducer(
    room: RoomState,
    dataProducerId: string,
    excludeSocketId: string,
  ) {
    for (const [socketId, peer] of room.peers.entries()) {
      if (socketId !== excludeSocketId) {
        peer.socket.emit('newDataProducer', {
          dataProducerId,
        });
      }
    }
  }
}
