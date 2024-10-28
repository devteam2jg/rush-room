import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { MissingConfigurationsException } from '~/src/common/exceptions/service.exception';

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

  private async uploadFileToS3(file: Express.Multer.File) {
    const key = `${Date.now().toString()}-${file.originalname}`;
    const params = {
      Key: key,
      Body: file.buffer,
      Bucket: this.s3_bucket,
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    const uploadFileS3 = await this.client.send(command);
    if (uploadFileS3.$metadata.httpStatusCode !== 200)
      throw new InternalServerErrorException('Failed to upload file to S3');
    return this.makeS3Url(key);
  }
  private makeS3Url(key: string) {
    return `https://${this.s3_bucket}.s3.${this.s3_region}.amazonaws.com/${key}`;
  }

  uploadImage(file: Express.Multer.File) {
    return this.uploadFileToS3(file);
  }
}
