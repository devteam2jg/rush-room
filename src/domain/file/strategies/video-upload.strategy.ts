// image-upload.strategy.ts
import { UploadStrategy } from './upload-strategy.interface';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MediaConvertService } from '~/src/domain/aws/mediaconvert.service';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
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
    const fileExtension = extname(file.originalname);
    const uuid = uuidv4();
    const key = `${this.uploadDirectory}/${uuid}${fileExtension}`;
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

    await this.mediaConvertService.makeHlsFileByS3Key(key);
    console.log(this.makeS3Url(uuid));
    return this.makeS3Url(uuid);
  }

  private makeS3Url(uuid: string): string {
    return `https://dhptnfoyrm8zr.cloudfront.net/hls/${uuid}.m3u8`;
  }
}
