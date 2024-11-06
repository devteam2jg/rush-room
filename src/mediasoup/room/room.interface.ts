import { IRouter } from '../interface/media-resources.interfaces';
import { Peer } from './peer.interface';

export interface IRoom {
  id: string;
  router: IRouter;
  sellerPeerId: string; // seller's peerId(socket id)
  peers: Map<string, Peer>;
}
