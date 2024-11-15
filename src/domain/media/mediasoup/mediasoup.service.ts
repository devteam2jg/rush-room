import { IWorker } from './interface/media-resources.interfaces';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import * as os from 'os';

@Injectable()
export class MediasoupService implements OnModuleInit {
  private nextWorkerIndex = 0;
  private readonly workers: IWorker[] = [];
  private readonly logger = new Logger(MediasoupService.name, {
    timestamp: true,
  });

  constructor() {}

  /**
   * create mediasoup workers on module init
   */
  public async onModuleInit() {
    const numWorkers = os.cpus().length;
    this.logger.verbose(`The number of cpus is ${numWorkers}`);
    for (let i = 0; i < numWorkers; ++i) {
      await this.createWorker();
    }
  }

  private async createWorker() {
    const worker = await mediasoup.createWorker();

    worker.on('died', () => {
      console.error('mediasoup worker has died');
      setTimeout(() => process.exit(1), 2000);
    });

    this.workers.push({ worker, routers: new Map() });
    return worker;
  }

  public getWorker() {
    const worker = this.workers[this.nextWorkerIndex].worker;
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }
}
