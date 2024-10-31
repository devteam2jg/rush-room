import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { UploadStrategy } from '~/src/domain/file/strategies/upload-strategy.interface';
import { ImageUploadStrategy } from '~/src/domain/file/strategies/image-upload.strategy';
import { AudioUploadStrategy } from '~/src/domain/file/strategies/audio-upload.strategy';
import { VideoUploadStrategy } from '~/src/domain/file/strategies/video-upload.strategy';
import { AwsConfigDto } from '~/src/domain/aws/dto/aws.dto';

@Injectable()
export class FileService {
  private readonly s3_bucket: string;

  constructor(
    @Inject('S3Client')
    private readonly client: S3Client,
    @Inject('AWS_CONFIG')
    private readonly awsConfig: AwsConfigDto,
  ) {
    this.s3_bucket = awsConfig.file.bucket;
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
      case 'video':
        return new VideoUploadStrategy(this.client, this.s3_bucket);
      default:
        throw new InternalServerErrorException('Unsupported file type');
    }
  }
}
