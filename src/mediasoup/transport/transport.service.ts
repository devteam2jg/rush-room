import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { RoomService } from '../room/room.service';
import { ITransportOptions } from './transport.interface';
import { WebRtcTransport } from 'mediasoup/node/lib/types';
import { webRtcTransport_options } from '../media.config';
import { ConnectTransportDto } from '~/src/domain/game/dto/connect.transport.dto';
import { Socket } from 'socket.io';

@Injectable()
export class TransportService {
  private logger = new Logger('TransportService', { timestamp: true });

  constructor(
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,
  ) {}

  public async createWebRtcTransport(
    roomId: string,
    peerId: string,
    direction: 'send' | 'recv',
  ): Promise<ITransportOptions> {
    const room = this.roomService.getRoom(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const transport: WebRtcTransport =
      await room.router.router.createWebRtcTransport({
        ...webRtcTransport_options,
        appData: {
          peerId,
          clientDirection: direction,
        },
      });

    this.roomService.addPeerToRoom(roomId, peerId);

    const peer = room.peers.get(peerId)!;
    peer.transports.set(transport.id, { transport });

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  public async connectTransport(
    connectTransportDto: ConnectTransportDto,
    socket: Socket,
  ) {
    const { dtlsParameters, auctionId, transportId } = connectTransportDto;
    const peerId = socket.id;
    const room = this.roomService.getRoom(auctionId);
    if (!room) {
      this.logger.error(`Room ${auctionId} not found`);
      return { error: 'Peer not found', success: false };
    }
    const peer = room?.peers.get(peerId);
    if (!peer) {
      this.logger.error(`Peer ${peerId} not found`);
      return { error: 'Peer not found' };
    }
    const transportData = peer.transports.get(transportId);
    if (!transportData) {
      this.logger.error(`Transport ${transportId} not found`);
      return { error: 'Transport not found', success: false };
    }
    await transportData.transport.connect({ dtlsParameters });
    this.logger.log(`>> transport connected`);
    return { error: null, success: true };
  }
}
