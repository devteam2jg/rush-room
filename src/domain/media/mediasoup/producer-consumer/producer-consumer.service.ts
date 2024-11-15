import { Injectable, Logger } from '@nestjs/common';
import { RoomService } from '../room/room.service';
import { IConsumeParams, IProduceParams } from './producer-consumer.interface';
import { Consumer } from 'mediasoup/node/lib/types';
import { IRoom } from '~/src/domain/media/mediasoup/room/room.interface';

@Injectable()
export class ProducerConsumerService {
  private readonly logger = new Logger('ProducerConsumerService', {
    timestamp: true,
  });
  constructor(private readonly roomService: RoomService) {}

  public async createProducer(params: IProduceParams): Promise<string> {
    const { roomId, client, kind, rtpParameters, transportId } = params;
    const peerId = client.id;
    const room = this.roomService.getRoom(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const peer = room.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }
    const transportData = peer.transports.get(transportId);
    if (!transportData) {
      throw new Error('Transport not found');
    }

    const producer = await transportData.transport.produce({
      kind,
      rtpParameters,
    });

    peer.producers.set(producer.id, { producer });
    room.sellerSocket = client;
    this.logger.debug(`New Seller Created ${peerId}`);
    this.logger.debug(`Created Producer Size: ${peer.producers.size}`);
    return producer.id;
  }

  public async createConsumer(params: IConsumeParams): Promise<any> {
    const { roomId, peerId, producerId, rtpCapabilities, transportId } = params;
    const room = this.roomService.getRoom(roomId);

    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    if (!room.router.router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error(`Cannot consume producer ${producerId}`);
    }

    const peer = room.peers.get(peerId)!;

    const transportData = peer.transports.get(transportId);
    if (!transportData) {
      throw new Error('Transport not found');
    }

    const consumer: Consumer = await transportData.transport.consume({
      producerId,
      rtpCapabilities,
      paused: true,
    });

    peer.consumers.set(consumer.id, { consumer });

    return {
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }

  public stopSellerPeer(param: { roomId: string }) {
    const { roomId } = param;
    const room = this.roomService.getRoomOrThrow(roomId);

    const prevSellerPeer = this.roomService.getPrevSeller(roomId);
    if (!prevSellerPeer) return;
    this.logger.debug(`Stop Seller Peer ${JSON.stringify(prevSellerPeer.id)}`);

    const prevSellerPeerId = room.sellerSocket.id;
    if (!prevSellerPeerId) return;

    const sellerPeer = room.peers.get(prevSellerPeerId);
    if (!sellerPeer) return;

    this.closePrevConsumers(room);

    for (const producer of sellerPeer.producers.values()) {
      producer.producer.close();
    }
    this.logger.debug(`Stop Seller Peer ${prevSellerPeerId}`);
    room.sellerSocket = null;
    return prevSellerPeer;
  }

  private closePrevConsumers(room: IRoom) {
    room.peers.forEach((peer) => {
      peer.consumers.forEach((consumer) => {
        consumer.consumer.close();
      });
      peer.consumers.clear();
    });
  }
}
