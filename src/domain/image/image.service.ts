import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class ImageService {
  private readonly client;
  constructor(
    @Inject('S3_IMAGE_KEY') private readonly image_key,
    @Inject('S3_IMAGE_SECRET') private readonly image_secret,
    @Inject('S3_IMAGE_BUCKET') private readonly image_bucket,
    @Inject('S3_IMAGE_REGION') private readonly image_region,
  ) {
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
}
