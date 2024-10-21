import { IsString, IsNumber, IsEnum } from 'class-validator';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';

export class JwtPayloadDto {
  @IsNumber()
  id: number;
  @IsString()
  name: string;
  @IsString()
  email: string;
  @IsEnum(SocialType)
  socialType: SocialType; //TODO: enum으로 변경
}
