import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';
import { KakaoProfileDto } from './dto/social-profile.dto';
import { JwtAuthGuard, KakaoOAuthGuard } from './guards/auth.guard';
import { ConfigService } from '@nestjs/config';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('terms')
  getTermsPage() {
    /*TODO: 카카오 회원가입을 위해서는 terms 관련 페이지가 필수적임 */
    return 'terms';
  }

  @UseGuards(JwtAuthGuard)
  @Get('test')
  getTestPage() {
    /* jwtAuth를 테스트하기 위한 endpoint */
    return 'test';
  }

  @UseGuards(KakaoOAuthGuard)
  @Get('kakao')
  async kakaoLogin() {
    return;
  }

  /* TODO: 로직 분리 */
  @UseGuards(KakaoOAuthGuard)
  @Get('kakao/callback')
  async kakaoLoginCallback(@Req() req, @Res() res): Promise<void> {
    // 카카오 인증 완료 후 로그인 처리
    const kakaoProfile: KakaoProfileDto = req.user;
    let user: UserDataDto;
    try {
      user = await this.authService.validateSocialUser(kakaoProfile);
      if (!user) {
        user = await this.authService.createSocialUser(kakaoProfile);
      }
      const accessToken = await this.authService.login(user);
      res.cookie('accessToken', accessToken, { httpOnly: true });
      res.redirect(this.configService.get<string>('REACT_APP_HOME'));
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async logout(@Res() res) {
    res.clearCookie('accessToken');
    res.redirect(this.configService.get<string>('REACT_APP_HOME'));
  }
}
