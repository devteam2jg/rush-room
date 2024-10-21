import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';

export class SocialProfileDto extends PartialType(UserDataDto) {
  @IsNotEmpty()
  @IsString()
  socialId: SocialType;

  @IsNotEmpty()
  @IsEnum(SocialType)
  socialType: SocialType;

  accessToken?: string;
  refreshToken?: string;
}

export class KakaoProfileDto extends SocialProfileDto {}
