import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty } from 'class-validator';

export class ActionImageListDto {
  //TODO: extends PartialType('ACTIONDTO') {
  id: string;
}
export class CreateImageDto extends PartialType(ActionImageListDto) {
  @IsNotEmpty()
  id: string;
  @IsNotEmpty()
  file: Express.Multer.File;
}
