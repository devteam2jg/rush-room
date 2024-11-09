import { IRouter } from '../interface/media-resources.interfaces';
import { Peer } from './peer.interface';
import { Socket } from 'socket.io';

export interface IRoom {
  id: string;
  router: IRouter;
  isSellerAgreed: boolean;
  sellerSocket: Socket; // seller's peerId(socket id)
  peers: Map<string, Peer>;
}
