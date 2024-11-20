import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { transportOptions } from '~/src/domain/media/mediasoup/media.config';
import { BullModule } from '@nestjs/bull';
import { bullqConfig } from '~/src/app/configs/bullq.config';
import { MediaModule } from '~/src/domain/media/media.module';
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
    MediaModule,
  ],
})
export class MediaAppModule {}
