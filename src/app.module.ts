import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediasoupModule } from '~/src/mediasoup/mediasoup.module';
import { SignalingModule } from '~/src/signaling/signaling.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MediasoupModule,
    SignalingModule,
  ],
})
export class AppModule {}
