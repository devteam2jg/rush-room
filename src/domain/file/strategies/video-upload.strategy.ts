// image-upload.strategy.ts
import { UploadStrategy } from './upload-strategy.interface';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MediaConvertService } from '~/src/domain/aws/mediaconvert.service';
@Injectable()
export class VideoUploadStrategy implements UploadStrategy {
  private readonly uploadDirectory: string;
  constructor(
    private readonly client: S3Client,
    private readonly s3_bucket: string,
    private readonly mediaConvertService: MediaConvertService,
  ) {
    this.uploadDirectory = 'videos';
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const key = `${this.uploadDirectory}/${Date.now().toString()}-${file.originalname}`;
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

  private makeS3Url(key: string): string {
    return `https://${this.s3_bucket}.s3.amazonaws.com/${key}`;
  }
}
