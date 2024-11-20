import { Module } from '@nestjs/common';
import { MediasoupModule } from './mediasoup/mediasoup.module';
import { SignalingModule } from './signaling/signaling.module';
import { MediaProcessor } from '~/src/domain/media/queue/media.processor';
@Module({
  imports: [MediasoupModule, SignalingModule],
  providers: [MediaProcessor],
})
export class MediaModule {}
