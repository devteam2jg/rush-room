import {
  IConsumer,
  IProducer,
  ITransport,
} from '~/src/domain/game/mediasoup/interface/media-resources.interfaces';

export interface Peer {
  id: string;
  transports: Map<string, ITransport>;
  producers: Map<string, IProducer>;
  consumers: Map<string, IConsumer>;
}
