import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as mediasoup from 'mediasoup';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/sfu',
})
export class AppGateway {
  @WebSocketServer()
  server: Server;

  private worker: mediasoup.types.Worker;
  private router: mediasoup.types.Router;
  private readonly transports: mediasoup.types.WebRtcTransport[] = [];
  private readonly producers: mediasoup.types.Producer[] = [];
  private readonly consumers: mediasoup.types.Consumer[] = [];
  private readonly logger = new Logger('AppGateway', { timestamp: true });

  constructor() {
    this.initializeMediasoup();
  }

  async initializeMediasoup() {
    try {
      this.worker = await mediasoup.createWorker();
      this.router = await this.worker.createRouter({
        mediaCodecs: [
          {
            kind: 'audio',
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2,
          },
          {
            kind: 'video',
            mimeType: 'video/VP8',
            clockRate: 90000,
          },
        ],
      });
      this.logger.verbose('Mediasoup worker and router initialized');
    } catch (error) {
      this.logger.error('Failed to initialize mediasoup:', error);
    }
  }

  @SubscribeMessage('getRouterRtpCapabilities')
  handleGetRtpCapabilities(@ConnectedSocket() client: Socket) {
    const rtpCapabilities = this.router.rtpCapabilities;
    this.logger.verbose('RtpCapabilities is delivered to client :', client.id);
    return rtpCapabilities;
  }

  @SubscribeMessage('createProducerTransport')
  async handleCreateTransport(@ConnectedSocket() client: Socket) {
    const transport = await this.router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: '192.168.1.25' }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    this.transports.push(transport);
    this.logger.verbose('Producer Transport created :', transport.id);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }
  @SubscribeMessage('createConsumerTransport')
  async handleConsumerCreateTransport(@ConnectedSocket() client: Socket) {
    const transport = await this.router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: '192.168.1.25' }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    this.transports.push(transport);
    this.logger.verbose('Consumer Transport created :', transport.id);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  @SubscribeMessage('connectProducerTransport')
  async handleConnectTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody() { transportId, dtlsParameters },
  ) {
    this.logger.verbose('Connect Producer Transport :', transportId);
    const transport = this.transports.find((t) => t.id === transportId);
    if (!transport) {
      return client.emit('error', 'Transport not found');
    }

    await transport.connect({ dtlsParameters });
    return { transportId };
  }
  @SubscribeMessage('connectConsumerTransport')
  async handleConsumerConnectTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody() { transportId, dtlsParameters },
  ) {
    this.logger.verbose('Connect Consumer Transport :', transportId);
    const transport = this.transports.find((t) => t.id === transportId);
    if (!transport) {
      return client.emit('error', 'Transport not found');
    }

    await transport.connect({ dtlsParameters });
    return { transportId };
  }

  @SubscribeMessage('getProducers')
  handleGetProducers(@ConnectedSocket() client: Socket) {
    const producerIds = this.producers.map((producer) => producer.id);
    this.logger.warn(
      'Producers is delivered to client :',
      client.id,
      producerIds,
    );
    return producerIds;
  }
  @SubscribeMessage('produce')
  async handleProduce(
    @ConnectedSocket() client: Socket,
    @MessageBody() { transportId, kind, rtpParameters },
  ) {
    const transport = this.transports.find((t) => t.id === transportId);
    if (!transport) {
      return client.emit('error', 'Transport not found');
    }

    const producer = await transport.produce({ kind, rtpParameters });
    this.producers.push(producer);

    return { id: producer.id };
  }

  @SubscribeMessage('consume')
  async handleConsume(
    @ConnectedSocket() client: Socket,
    @MessageBody() { transportId, producerId, rtpCapabilities },
  ) {
    const transport = this.transports.find((t) => t.id === transportId);
    if (!transport) {
      return client.emit('error', 'Transport not found');
    }

    const producer = this.producers.find((p) => p.id === producerId);
    if (!producer) {
      return client.emit('error', 'Producer not found');
    }

    if (!this.router.canConsume({ producerId: producer.id, rtpCapabilities })) {
      return client.emit('error', 'Cannot consume');
    }

    const consumer = await transport.consume({
      producerId: producer.id,
      rtpCapabilities,
      paused: true,
    });

    this.consumers.push(consumer);
    this.logger.verbose('Consumer created :', consumer.id);

    return {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }
}
