import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [ImageController],
  providers: [
    ImageService,
    {
      provide: 'S3_IMAGE_KEY',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('S3_IMAGE_KEY'),
    },
    {
      provide: 'S3_IMAGE_SECRET',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('S3_IMAGE_SECRET'),
    },
    {
      provide: 'S3_IMAGE_BUCKET',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('S3_IMAGE_BUCKET'),
    },
  ],
})
export class ImageModule {}
