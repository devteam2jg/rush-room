import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { transportOptions } from '~/src/domain/media/mediasoup/media.config';
import { BullModule } from '@nestjs/bull';
import { bullqConfig } from '~/src/app/configs/bullq.config';
import { MediasoupModule } from '~/src/domain/media/mediasoup/mediasoup.module';
import { SignalingModule } from '~/src/domain/media/signaling/signaling.module';
import { MediaProcessor } from '~/src/domain/media/queue/media.processor';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [transportOptions],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: bullqConfig,
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'media-queue',
    }),
    MediasoupModule,
    SignalingModule,
  ],
  providers: [MediaProcessor],
})
export class MediaAppModule {}
