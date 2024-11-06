import { Injectable, Logger } from '@nestjs/common';
import { RoomService } from '../room/room.service';
import { IConsumeParams, IProduceParams } from './producer-consumer.interface';
import { Consumer } from 'mediasoup/node/lib/types';

@Injectable()
export class ProducerConsumerService {
  private readonly logger = new Logger('ProducerConsumerService', {
    timestamp: true,
  });
  constructor(private readonly roomService: RoomService) {}

  public async createProducer(params: IProduceParams): Promise<string> {
    const { auctionId, peerId, kind, rtpParameters, transportId } = params;
    const room = this.roomService.getRoom(auctionId);
    if (!room) {
      throw new Error(`Room ${auctionId} not found`);
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
    room.sellerPeerId = peerId;
    return producer.id;
  }

  public async createConsumer(params: IConsumeParams): Promise<any> {
    const { auctionId, peerId, producerId, rtpCapabilities, transportId } =
      params;
    const room = this.roomService.getRoom(auctionId);

    if (!room) {
      throw new Error(`Room ${auctionId} not found`);
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
      paused: false,
    });

    peer.consumers.set(consumer.id, { consumer });
    this.logger.debug(`Created Consumer Size: ${peer.consumers.size}`);
    return {
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }

  public stopSellerPeer(param: { auctionId: string }) {
    const { auctionId } = param;
    const room = this.roomService.getRoom(auctionId);
    if (!room) throw new Error(`Room ${auctionId} not found`);
    const sellerPeerId = room.sellerPeerId;
    if (!sellerPeerId) return;
    const sellerPeer = room.peers.get(sellerPeerId);
    if (!sellerPeer) return;
    for (const producer of sellerPeer.producers.values()) {
      producer.producer.close();
    }
    room.sellerPeerId = null;
    return sellerPeerId;
  }
}
