import * as mediasoup from 'mediasoup';
import { registerAs } from '@nestjs/config';

export const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 300,
    },
  },
];

export const TRANSPORT_OPTIONS_KEY = 'mediasoup.transport.options';

export const transportOptions = registerAs(
  TRANSPORT_OPTIONS_KEY,
  (): mediasoup.types.WebRtcTransportOptions => ({
    listenInfos: [
      {
        ip: process.env.WEBRTC_LISTEN_IP || '127.0.0.1',
        announcedAddress: process.env.WEBRTC_ANNOUNCED_IP || '127.0.0.1',
        protocol: 'udp',
        portRange: {
          min: +process.env.WEBRTC_PORT_MIN,
          max: +process.env.WEBRTC_PORT_MAX,
        },
      },
      {
        ip: process.env.WEBRTC_LISTEN_IP || '127.0.0.1',
        announcedAddress: process.env.WEBRTC_ANNOUNCED_IP || '127.0.0.1',
        protocol: 'tcp',
        portRange: {
          min: +process.env.WEBRTC_PORT_MIN,
          max: +process.env.WEBRTC_PORT_MAX,
        },
      },
    ],
  }),
);
