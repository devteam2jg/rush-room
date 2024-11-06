import { ITransportOptions } from '~/src/domain/game/mediasoup/transport/transport.interface';
import { RtpCapabilities } from 'mediasoup/node/lib/types';
import { MediaKind } from 'mediasoup/node/lib/RtpParameters';

export class JoinAuctionResultDto {
  sendTransportOptions: ITransportOptions;
  recvTransportOptions: ITransportOptions;
  rtpCapabilities: RtpCapabilities;
  peerIds: string[];
  existingProducers: { producerId: string; peerId: string; kind: MediaKind }[];
}
