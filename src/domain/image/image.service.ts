import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { MissingConfigurationsException } from '~/src/common/exceptions/service.exception';
import {
  ActionImageListDto,
  CreateImageDto,
} from '~/src/domain/image/dto/image.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from '~/src/domain/image/entities/image.entity';

@Injectable()
export class ImageService {
  private readonly client: S3Client;
  private readonly image_key: string;
  private readonly image_secret: string;
  private readonly image_bucket: string;
  private readonly image_region: string;

  constructor(
    configService: ConfigService,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) {
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

  async upload(createImageDto: CreateImageDto) {
    const { id, file } = createImageDto;
    const imageUrl: string = await this.uploadImageToS3(file);
    const image: Image = await this.imageRepository.findOneBy({ bid_id: id });
    if (image) {
      image.serialized_image_list.push(imageUrl);
      await this.imageRepository.update(image.id, image);
    } else {
      await this.imageRepository.save({
        bid_id: id,
        serialized_image_list: [imageUrl],
      });
    }
  }

  async getImageListByActionId(
    actionImageListDto: ActionImageListDto,
  ): Promise<string[]> {
    const { id } = actionImageListDto;
    const image: Image = await this.imageRepository.findOneBy({
      bid_id: id,
    });
    const { serialized_image_list } = image;
    return serialized_image_list;
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
  async uploadImageToS3(file: Express.Multer.File) {
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
    return `https://${this.image_bucket}.s3.${this.image_region}.amazonaws.com/${key}`;
  }
}
