import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediasoupModule } from '~/src/mediasoup/mediasoup.module';
import { SignalingModule } from '~/src/signaling/signaling.module';
import { transportOptions } from '~/src/mediasoup/media.config';

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
export class AppModule {}
