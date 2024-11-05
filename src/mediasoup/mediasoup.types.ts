import { Socket } from 'socket.io';
import * as mediasoup from 'mediasoup';
// mediasoup.types.ts
export interface RoomState {
  router: mediasoup.types.Router;
  roomId: string;
  sellingProducer: mediasoup.types.Producer;
  consumers: Map<string, mediasoup.types.Consumer>; // consumerId
  transports: Map<string, mediasoup.types.Transport>; // transportId
  peers: Map<string, Peer>; // clientSocketId: Peer
  dataProducers?: Map<string, mediasoup.types.DataProducer>; // 추가
}

export interface Peer {
  userId: string;
  socket: Socket; // clientSocket itself
  consumerIds: Set<string>;
}
