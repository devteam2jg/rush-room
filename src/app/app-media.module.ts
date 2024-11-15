import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediasoupModule } from '~/src/domain/media/mediasoup/mediasoup.module';
import { SignalingModule } from '~/src/domain/media/signaling/signaling.module';
import { transportOptions } from '~/src/domain/media/mediasoup/media.config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [transportOptions],
    }),
    MediasoupModule,
    SignalingModule,
  ],
})
export class MediaAppModule {}
