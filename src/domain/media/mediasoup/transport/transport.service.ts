import { Injectable, Logger } from '@nestjs/common';
import { RoomService } from '../room/room.service';
import { ITransportOptions } from './transport.interface';
import { WebRtcTransport } from 'mediasoup/node/lib/types';
import { TRANSPORT_OPTIONS_KEY } from '../media.config';
import { ConfigService } from '@nestjs/config';
import * as mediasoup from 'mediasoup';
import { Socket } from 'socket.io';

@Injectable()
export class TransportService {
  private logger = new Logger('TransportService', { timestamp: true });

  constructor(
    private readonly roomService: RoomService,
    private readonly configService: ConfigService,
  ) {}

  public async createWebRtcTransport(
    roomId: string,
    peerSocket: Socket,
    direction: 'send' | 'recv',
  ): Promise<ITransportOptions> {
    const room = this.roomService.getRoom(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }
    const peerId = peerSocket.id;
    const webRtcTransportOptions =
      this.configService.get<mediasoup.types.WebRtcTransportOptions>(
        TRANSPORT_OPTIONS_KEY,
      );
    const transport: WebRtcTransport =
      await room.router.router.createWebRtcTransport({
        ...webRtcTransportOptions,
        appData: {
          peerId,
          clientDirection: direction,
        },
      });

    transport.on('@close', () => {
      this.logger.debug(
        `Transport on event close listener: ${direction} WebRtcTransport closed. peerId: ${peerId} roomId: ${roomId} `,
      );
      this.roomService.closePeerResource(room, peerId);
    });

    this.roomService.addPeerToRoom(roomId, peerSocket);

    const peer = room.peers.get(peerId)!;
    peer.transports.set(transport.id, { transport });

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }
}
