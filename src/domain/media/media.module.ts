import { Module } from '@nestjs/common';
import { MediasoupModule } from './mediasoup/mediasoup.module';
import { SignalingModule } from './signaling/signaling.module';
import { BullModule } from '@nestjs/bull';
import { MediaProcessor } from '~/src/domain/media/queue/media.processor';
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'media-queue',
    }),
    MediasoupModule,
    SignalingModule,
    MediaProcessor,
  ],
})
export class MediaModule {}
