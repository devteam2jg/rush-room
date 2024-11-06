import * as mediasoup from 'mediasoup';

export const mediasoupConfig = {
  workers: {
    num: process.env.MEDIASOUP_WORKERS_NUM || 1,
    settings: {
      logLevel: 'debug',
      logTags: [
        'info',
        'ice',
        'dtls',
        'rtp',
        'srtp',
        'rtcp',
        'rtx',
        'bwe',
        'score',
        'simulcast',
        'svc',
        'sctp',
      ],
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
    },
  } as mediasoup.types.WorkerSettings<mediasoup.types.AppData>,
  router: {
    mediaCodecs: [
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
          'x-google-start-bitrate': 1000,
        },
      },
      // {
      //   kind: 'video',
      //   mimeType: 'video/H264',
      //   clockRate: 90000,
      //   parameters: {
      //     'packetization-mode': 1,
      //     'profile-level-id': '4d0032',
      //     'level-asymmetry-allowed': 1,
      //   },
      // },
    ] as mediasoup.types.RtpCodecCapability[],
  },
  webRtcTransport: {
    listenIps: [
      {
        protocol: 'udp',
        ip: '0.0.0.0',
        // announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP, // 'localhost'
        announcedIp: null, // 'localhost'
        portRange: {
          min: process.env.MEDIASOUP_MIN_PORT || 40000,
          max: process.env.MEDIASOUP_MAX_PORT || 49999,
        },
      },
      {
        protocol: 'tcp',
        ip: '0.0.0.0',
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP, // 'localhost'
        portRange: {
          min: process.env.MEDIASOUP_MIN_PORT || 40000,
          max: process.env.MEDIASOUP_MAX_PORT || 49999,
        },
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  } as mediasoup.types.WebRtcTransportOptions<mediasoup.types.AppData>,
};
