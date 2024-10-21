import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';
export class SocialProfileDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

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
