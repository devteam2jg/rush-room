import { MediaKind } from 'mediasoup/node/lib/RtpParameters';
import { RtpParameters } from 'mediasoup/node/lib/types';

export class ProduceDto {
  auctionId: string;
  kind: MediaKind;
  transportId: string;
  rtpParameters: RtpParameters;
}
