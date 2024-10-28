import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { MissingConfigurationsException } from '~/src/common/exceptions/service.exception';
import { UploadStrategy } from '~/src/domain/file/strategies/upload-strategy.interface';
import { ImageUploadStrategy } from '~/src/domain/file/strategies/image-upload.strategy';
import { AudioUploadStrategy } from '~/src/domain/file/strategies/audio-upload.strategy';

@Injectable()
export class FileService {
  private readonly client: S3Client;
  private readonly s3_key: string;
  private readonly s3_secret: string;
  private readonly s3_bucket: string;
  private readonly s3_region: string;

  constructor(private readonly configService: ConfigService) {
    this.s3_bucket = configService.get<string>('S3_IMAGE_BUCKET_NAME');
    this.s3_key = configService.get<string>('S3_IMAGE_ACCESS_KEY');
    this.s3_secret = configService.get<string>('S3_IMAGE_ACCESS_SECRET');
    this.s3_region = configService.get<string>('S3_REGION');
    this.checkConfigurations();
    this.client = new S3Client({
      region: this.s3_region,
      credentials: {
        accessKeyId: this.s3_key,
        secretAccessKey: this.s3_secret,
      },
    });
  }

  private checkConfigurations() {
    if (!this.s3_bucket || !this.s3_key || !this.s3_secret || !this.s3_region)
      throw MissingConfigurationsException('Missing S3 Configurations');
  }

  /*
   * @deprecated User uploadFile instead
   */
  uploadImage(file: Express.Multer.File) {
    return this.uploadFile(file);
  }
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const strategy = this.getStrategy(file);
    return strategy.uploadFile(file);
  }

  private getStrategy(file: Express.Multer.File): UploadStrategy {
    const mimeType = file.mimetype;
    const [type] = mimeType.split('/');
    switch (type) {
      case 'image':
        return new ImageUploadStrategy(this.client, this.s3_bucket);
      case 'audio':
        return new AudioUploadStrategy(this.client, this.s3_bucket);
      default:
        throw new InternalServerErrorException('Unsupported file type');
    }
  }
}
