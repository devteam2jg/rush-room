import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { KakaoProfileDto } from './dto/social-profile.dto';
import { JwtAuthGuard, KakaoOAuthGuard } from './guards/auth.guard';
import { ConfigService } from '@nestjs/config';
import { LoginFilter } from '~/src/domain/auth/filters/login.filter';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /*
    @Get('terms')
    - 이용약관 페이지를 렌더링합니다.
    TODO: 이 페이지는 프론트엔드에서 렌더링되어야 합니다.
  */
  @Get('terms')
  getTermsPage() {
    return 'terms';
  }
  /* 
    jwtAuth를 테스트하기 위한 endpoint입니다. 
  */
  @UseGuards(JwtAuthGuard)
  @Get('test')
  getTestPage() {
    return 'test';
  }

  /*
    @UseGuards(KakaoOAuthGuard) 
    - KakaoOAuthGuard를 사용하여 카카오 로그인을 처리합니다.
    @Get('kakao')
    - 카카오 로그인 URL을 설정합니다. 사용자가 카카오 로그인을 하기 위해 접근하는 URL입니다.
  */
  @UseGuards(KakaoOAuthGuard)
  @Get('kakao')
  async kakaoLogin() {
    return;
  }

  /*
    @UseGuards(KakaoOAuthGuard) 
    - KakaoOAuthGuard를 사용하여 카카오 로그인을 처리합니다.
    @Get('kakao/callback')
    - 카카오 로그인 콜백 URL을 설정합니다. 사용자가 카카오 로그인을 완료한 후 카카오 인증서버는 이 URL로 사용자를 리다이렉트합니다.
    @UseFilters(LoginFilter)
    - LoginFilter를 사용하여 예외처리를 합니다.
    accessToken
    - 사용자가 로그인에 성공하면 발급받은 accessToken을 쿠키에 저장합니다.
  */
  @UseGuards(KakaoOAuthGuard)
  @Get('kakao/callback')
  @UseFilters(LoginFilter)
  async kakaoLoginCallback(@Req() req, @Res() res): Promise<void> {
    const kakaoProfile: KakaoProfileDto = req.user;
    const accessToken = await this.authService.loginSocialUser(kakaoProfile);
    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.redirect(this.configService.get<string>('REACT_APP_HOME'));
  }

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async logout(@Res() res) {
    res.clearCookie('accessToken');
    res.redirect(this.configService.get<string>('REACT_APP_HOME'));
  }
}
