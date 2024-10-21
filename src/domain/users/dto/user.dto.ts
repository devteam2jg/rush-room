import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';

export class UserDataDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsString()
  socialId: string;
  @IsString()
  socialType: SocialType;

  @IsString()
  profileUrl: string;
  @IsString()
  thumbnailUrl: string;
}

export class FindByDto extends PartialType(UserDataDto) {}

export class CreateUserDto extends UserDataDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {}
