import { Strategy } from 'passport-kakao';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { KakaoProfileDto } from '../dto/social-profile.dto';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';
@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.get('KAKAO_CLIENT_ID'),
      clientSecret: configService.get('KAKAO_CLIENT_SECRET'),
      callbackURL: configService.get('KAKAO_CALLBACK_URL'),
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const user: KakaoProfileDto = {
      email: profile._json.kakao_account.email,
      name: profile.username,
      socialId: profile.id,
      socialType: SocialType.KAKAO,
      profileUrl: profile._json.kakao_account.profile.profile_image_url,
      thumbnailUrl: profile._json.kakao_account.profile.thumbnail_image_url,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
    return user;
  }
}
