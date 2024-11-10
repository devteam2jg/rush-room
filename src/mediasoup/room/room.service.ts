import { mediaCodecs } from './../media.config';
import { Injectable, Logger } from '@nestjs/common';
import { IRoom } from './room.interface';
import { MediasoupService } from '../mediasoup.service';
import { Socket } from 'socket.io';

@Injectable()
export class RoomService {
  private rooms: Map<string, IRoom> = new Map();
  private logger = new Logger(RoomService.name, { timestamp: true });
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
      isSellerAgreed: false,
      sellerSocket: null,
    };
    this.rooms.set(roomId, newRoom);

    console.log(`>> router created for room ${roomId}`);
    return newRoom;
  }

  public getRoom(roomId: string): IRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomOrThrow(roomId: string): IRoom | undefined {
    const room = this.getRoom(roomId);
    if (!room) {
      this.logger.error(`Room ${roomId} not found`);
      throw new Error(`Room ${roomId} not found`);
    }
    return room;
  }

  public getPrevSeller(roomId) {
    const room = this.getRoom(roomId);
    return room?.sellerSocket;
  }

  public getPeer(room: IRoom, peerId: string) {
    const peer = room.peers.get(peerId);
    if (!peer) return;
    return peer;
  }

  public removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
    this.logger.debug(`-----room ${roomId} removed`);
  }

  public addPeerToRoom(roomId: string, peerSocket: Socket) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const peerId = peerSocket.id;

    if (!room.peers.has(peerId)) {
      room.peers.set(peerId, {
        id: peerId,
        socket: peerSocket,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
      });
    }
  }

  public setIsAgreed(room: IRoom, isAgreed: boolean) {
    room.isSellerAgreed = isAgreed;
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
