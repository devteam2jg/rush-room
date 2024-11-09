import {
  IConsumer,
  IProducer,
  ITransport,
} from '../interface/media-resources.interfaces';
import { Socket } from 'socket.io';

export interface Peer {
  id: string;
  socket: Socket;
  transports: Map<string, ITransport>;
  producers: Map<string, IProducer>;
  consumers: Map<string, IConsumer>;
}
