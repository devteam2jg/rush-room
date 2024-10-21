import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';

export class UserDataDto {
  @IsNumber()
  id: number;
  @IsString()
  name: string;
  @IsString()
  email: string;
  @IsString()
  socialId: string;
  @IsString()
  socialType: SocialType;

  @IsString()
  profile_url: string;
  @IsString()
  thumbnail_url: string;
}

export class FindBySocialIdDto {
  @IsString()
  socialId: string;
  @IsString()
  socialType: SocialType;
}

export class FindByIdDto {
  @IsNumber()
  id: number;
}
export class FindByDto extends PartialType(UserDataDto) {}

export class CreateUserDto extends UserDataDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {}
