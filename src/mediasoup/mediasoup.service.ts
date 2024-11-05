// mediasoup.service.ts
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import { ConfigService } from '@nestjs/config';
import { mediasoupConfig } from '~/src/mediasoup/mediasoup.config';
import { RoomState } from '~/src/mediasoup/mediasoup.types';

@Injectable()
export class MediasoupService implements OnModuleInit, OnModuleDestroy {
  private workers: mediasoup.types.Worker[] = [];
  private nextWorkerId = 0;
  private readonly logger = new Logger('MediasoupService', { timestamp: true });

  constructor(private configService: ConfigService) {}

  private readonly mediaCodecs = mediasoupConfig.router.mediaCodecs;

  private readonly workerSettings = mediasoupConfig.workers;

  async onModuleInit() {
    await this.initializeWorkers();
  }

  async onModuleDestroy() {
    await this.closeWorkers();
  }

  private async initializeWorkers() {
    const numWorkers = this.configService.get('MEDIASOUP_WORKERS_NUM') || 1;

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker(this.workerSettings);

      worker.on('died', () => {
        this.logger.error(
          'mediasoup worker died, exiting in 2 seconds... [pid:%d]',
          worker.pid,
        );
        setTimeout(() => process.exit(1), 2000);
      });

      this.workers.push(worker);
    }

    this.logger.log(`Created ${this.workers.length} mediasoup workers`);
  }

  private async closeWorkers() {
    for (const worker of this.workers) {
      await worker.close();
    }
  }

  // 라운드 로빈 방식으로 워커 선택
  private getNextWorker(): mediasoup.types.Worker {
    const worker = this.workers[this.nextWorkerId];
    this.nextWorkerId = (this.nextWorkerId + 1) % this.workers.length;
    return worker;
  }

  async createRouter(): Promise<mediasoup.types.Router> {
    const worker = this.getNextWorker();
    return await worker.createRouter({ mediaCodecs: this.mediaCodecs });
  }

  // TODO: case 나눠서 RoomState 관련 정보 삭제. 우선 handleDisconnect에서 정리하도록 두기.
  // gateway에 유사 Logic 있으나 많은 수정 필요.
  async cleanupUserResource() {}
  async createWebRtcTransport(
    router: mediasoup.types.Router,
    options: {
      clientId?: string;
      type?: 'produce' | 'consume';
      webRtcTransportOptions?: Partial<mediasoup.types.WebRtcTransportOptions>;
    } = {},
  ): Promise<mediasoup.types.WebRtcTransport> {
    const transportOptions = {
      ...mediasoupConfig.webRtcTransport,
      ...options.webRtcTransportOptions,
    } as mediasoup.types.WebRtcTransportOptions;
    this.logger.log(
      `transport options ${mediasoupConfig.webRtcTransport.listenIps[0]}`,
    );
    // SCTP 설정이 필요한 경우
    // if (options.type === 'produce') {
    //   await transport.enableTraceEvent(['bwe']);
    //   transport.on('trace', (trace) => {
    //     console.log('transport "trace" event', trace);
    //   });
    // }

    return await router.createWebRtcTransport({
      ...transportOptions,
      appData: { clientId: options.clientId, type: options.type },
    });
  }

  // Producer 설정 가져오기
  getProducerOptions(kind: string) {
    switch (kind) {
      case 'audio':
        return {
          codecOptions: {
            opusStereo: true,
            opusDtx: true,
            opusFec: true,
            opusNack: true,
          },
        };
      case 'video':
        return {
          codecOptions: {
            videoGoogleStartBitrate: 1000,
          },
          encodings: [
            {
              maxBitrate: 900000,
              scalabilityMode: 'S1T3',
            },
          ],
        };
      default:
        return {};
    }
  }
  // cleanup 함수 (이전 코드에 추가)
  private async cleanupPeerResources(peerId: string, room: RoomState) {
    // Consumers 정리
    for (const [consumerId, consumer] of room.consumers) {
      if (consumer.appData.peerId === peerId) {
        // consumer가 paused 상태가 아니라면 pause
        if (!consumer.paused) {
          await consumer.pause();
        }
        consumer.close();
        room.consumers.delete(consumerId);
      }
    }
    // ... 나머지 cleanup 코드
  }

  // Consumer 설정 가져오기
  getConsumerOptions(kind: string) {
    switch (kind) {
      case 'audio':
        return {
          codecOptions: {
            opusStereo: true,
            opusDtx: true,
          },
        };
      case 'video':
        return {
          codecOptions: {
            videoGoogleStartBitrate: 1000,
          },
        };
      default:
        return {};
    }
  }

  // 라우터 RTP 기능 체크
  async checkRouterCapabilities(
    router: mediasoup.types.Router,
    rtpCapabilities: mediasoup.types.RtpCapabilities,
  ): Promise<boolean> {
    try {
      return router.canConsume({
        producerId: 'temp',
        rtpCapabilities,
      });
    } catch (error) {
      console.error('checkRouterCapabilities error:', error);
      return false;
    }
  }

  // 트랜스포트 상태 모니터링
  async monitorTransport(transport: mediasoup.types.Transport) {
    // transport.on('routerclose', () => {
    //   console.log('Transport closed because router closed');
    // });
    //
    // transport.on('dtlsstatechange', (dtlsState) => {
    //   if (dtlsState === 'failed' || dtlsState === 'closed') {
    //     console.log('Transport dtls state changed to', dtlsState);
    //   }
    // });
    //
    // transport.on('icestatechange', (iceState) => {
    //   if (iceState === 'failed' || iceState === 'closed') {
    //     console.log('Transport ice state changed to', iceState);
    //   }
    // });
  }

  // Producer 모니터링
  async monitorProducer(producer: mediasoup.types.Producer) {
    producer.on('score', (score) => {
      console.log('Producer score:', score);
    });

    producer.on('videoorientationchange', (videoOrientation) => {
      console.log('Video orientation changed:', videoOrientation);
    });
  }

  // Consumer 모니터링
  async monitorConsumer(consumer: mediasoup.types.Consumer) {
    consumer.on('layerschange', (layers) => {
      console.log('Consumer layers changed:', layers);
    });

    consumer.on('score', (score) => {
      console.log('Consumer score:', score);
    });
  }

  // 워커 로드 밸런싱을 위한 상태 체크
  async getWorkerLoad(worker: mediasoup.types.Worker) {
    const usage = await worker.getResourceUsage();
    return {
      pid: worker.pid,
      usage,
    };
  }

  // 전체 워커 상태 체크
  async getWorkersStatus() {
    const status = await Promise.all(
      this.workers.map(async (worker) => {
        const load = await this.getWorkerLoad(worker);
        return {
          pid: worker.pid,
          load,
        };
      }),
    );
    return status;
  }

  // 라우터 통계 수집
  async getRouterStats(router: mediasoup.types.Router) {
    try {
      const stats = await router.dump();
      return stats;
    } catch (error) {
      console.error('Failed to get router stats:', error);
      return null;
    }
  }
}
