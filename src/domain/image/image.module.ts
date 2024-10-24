import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { ConfigService } from '@nestjs/config';
@Module({
  controllers: [ImageController],
  providers: [
    ImageService,
    {
      provide: 'S3_IMAGE_KEY',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('S3_IMAGE_ACCESS_KEY'),
      inject: [ConfigService],
    },
    {
      provide: 'S3_IMAGE_SECRET',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('S3_IMAGE_ACCESS_SECRET'),
      inject: [ConfigService],
    },
    {
      provide: 'S3_IMAGE_BUCKET',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('S3_IMAGE_BUCKET_NAME'),
      inject: [ConfigService],
    },
    {
      provide: 'S3_IMAGE_REGION',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('S3_REGION'),
      inject: [ConfigService],
    },
  ],
})
export class ImageModule {}
