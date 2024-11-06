import { RtpCapabilities } from 'mediasoup/node/lib/types';

export class ConsumerDto {
  auctionId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
  transportId: string;
}
