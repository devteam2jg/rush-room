import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as mediasoup from 'mediasoup';

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
      console.log('Mediasoup worker and router initialized');
    } catch (error) {
      console.error('Failed to initialize mediasoup:', error);
    }
  }

  @SubscribeMessage('getRouterRtpCapabilities')
  handleGetRtpCapabilities(@ConnectedSocket() client: Socket) {
    const rtpCapabilities = this.router.rtpCapabilities;
    console.log('rtpCapabilities', rtpCapabilities);
    client.emit('routerRtpCapabilities', rtpCapabilities);
  }

  @SubscribeMessage('createProducerTransport')
  async handleCreateTransport(@ConnectedSocket() client: Socket) {
    const transport = await this.router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: '192.168.1.21' }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    this.transports.push(transport);

    client.emit('transportCreated', {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });
  }

  @SubscribeMessage('connectProducerTransport')
  async handleConnectTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody() { transportId, dtlsParameters },
  ) {
    const transport = this.transports.find((t) => t.id === transportId);
    if (!transport) {
      return client.emit('error', 'Transport not found');
    }

    await transport.connect({ dtlsParameters });
    client.emit('transportConnected', { transportId });
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

    client.emit('produced', { id: producer.id });
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

    client.emit('consumed', {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    });
  }
}
