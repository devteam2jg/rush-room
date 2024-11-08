import { RtpCapabilities, RtpParameters } from 'mediasoup/node/lib/types';
import { Socket } from 'socket.io';

export interface IProduceParams {
  roomId: string;
  client: Socket;
  kind: 'audio' | 'video';
  rtpParameters: RtpParameters;
  transportId: string;
}

export interface IConsumeParams {
  roomId: string;
  peerId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
  transportId: string;
}
