import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class SocialProfileDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  socialId: string;

  @IsNotEmpty()
  @IsString()
  socialType: string;

  accessToken?: string;
  refreshToken?: string;
}

export class KakaoProfileDto extends SocialProfileDto {}
