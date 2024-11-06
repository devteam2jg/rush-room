import { DtlsParameters } from 'mediasoup/node/lib/types';

export class ConnectTransportDto {
  auctionId: string;
  dtlsParameters: DtlsParameters;
  transportId: string;
}
