import { Inject, Injectable } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';

@Injectable()
export class ImageService {
  constructor(
    @Inject('S3_IMAGE_KEY') private readonly image_key,
    @Inject('S3_IMAGE_SECRET') private readonly imaiage_secret,
  ) {}
  create(createImageDto: CreateImageDto) {
    return 'This action adds a new image';
  }

  findOne(id: number) {
    return `This action returns a #${id} image`;
  }
}
