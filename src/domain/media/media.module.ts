import { Module } from '@nestjs/common';
import { MediasoupModule } from './mediasoup/mediasoup.module';
import { SignalingModule } from './signaling/signaling.module';
import { BullModule } from '@nestjs/bull';
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'media-queue',
    }),
    MediasoupModule,
    SignalingModule,
  ],
})
export class MediaModule {}
