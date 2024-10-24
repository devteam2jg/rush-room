import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { MissingConfigurationsException } from '~/src/common/exceptions/service.exception';

@Injectable()
export class ImageService {
  private readonly client: S3Client;
  private readonly image_key: string;
  private readonly image_secret: string;
  private readonly image_bucket: string;
  private readonly image_region: string;

  constructor(configService: ConfigService) {
    this.image_bucket = configService.get<string>('S3_IMAGE_BUCKET_NAME');
    this.image_key = configService.get<string>('S3_IMAGE_ACCESS_KEY');
    this.image_secret = configService.get<string>('S3_IMAGE_ACCESS_SECRET');
    this.image_region = configService.get<string>('S3_REGION');
    this.checkConfigurations();
    this.client = new S3Client({
      region: this.image_region,
      credentials: {
        accessKeyId: this.image_key,
        secretAccessKey: this.image_secret,
      },
    });
  }

  async upload(file: Express.Multer.File) {
    const key = `${Date.now().toString()}-${file.originalname}`;
    const params = {
      Key: key,
      Body: file.buffer,
      Bucket: this.image_bucket,
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    const uploadFileS3 = await this.client.send(command);

    if (uploadFileS3.$metadata.httpStatusCode !== 200)
      throw new BadRequestException('Failed upload File');
  }

  findOne(id: number) {
    return `This action returns a #${id} image`;
  }

  private checkConfigurations() {
    if (
      !this.image_bucket ||
      !this.image_key ||
      !this.image_secret ||
      !this.image_region
    )
      throw MissingConfigurationsException('Missing S3 Configurations');
  }
}
