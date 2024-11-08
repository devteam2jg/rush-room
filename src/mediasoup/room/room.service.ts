import { mediaCodecs } from './../media.config';
import { Injectable } from '@nestjs/common';
import { IRoom } from './room.interface';
import { MediasoupService } from '../mediasoup.service';

@Injectable()
export class RoomService {
  private rooms: Map<string, IRoom> = new Map();
  constructor(private readonly mediasoupService: MediasoupService) {}

  public async createRoom(roomId: string): Promise<IRoom> {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId);
    }

    const worker = this.mediasoupService.getWorker();
    const router = await worker.createRouter({ mediaCodecs });
    const newRoom: IRoom = {
      id: roomId,
      router: { router },
      peers: new Map(),
      sellerSocket: null,
    };
    this.rooms.set(roomId, newRoom);

    console.log(`>> router created for room ${roomId}`);
    return newRoom;
  }

  public getRoom(roomId: string): IRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getPeer(room: IRoom, peerId: string) {
    const peer = room.peers.get(peerId);
    if (!peer) return;
    return peer;
  }

  public removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  public addPeerToRoom(roomId: string, peerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    if (!room.peers.has(peerId)) {
      room.peers.set(peerId, {
        id: peerId,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
      });
    }
  }

  public closePeerResource(room: IRoom, peerId: string) {
    const peer = room.peers.get(peerId);
    if (!peer) return false;
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
    room.peers.delete(peerId);
    return true;
  }

  public removePeerFromRoom(roomId: string, peerId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.peers.delete(peerId);
    }
  }
}
