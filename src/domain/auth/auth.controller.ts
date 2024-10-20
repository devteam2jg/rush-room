import { Controller, Get, Req, Res, UseGuards, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from '@nestjs/common';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';
import { KakaoProfileDto } from './dto/social-profile.dto';
import { JwtAuthGuard,KakaoOAuthGuard } from './guards/auth.guard';



@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  
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
  async kakaoLogin(@Req() req: Request) {
    return;
  }

  @UseGuards(KakaoOAuthGuard)
  @Get('kakao/callback')
  async kakaoLoginCallback(@Req() req, @Res() res): Promise<void> {
    // 카카오 인증 완료 후 로그인 처리
    const kakaoProfile:KakaoProfileDto = req.user;
    let user: UserDataDto;
    try {
      user = await this.authService.validateSocialUser(kakaoProfile);
      if (!user) {
        user = await this.authService.createSocialUser(kakaoProfile);
      }
      const accessToken = await this.authService.login(user);
      /* cookie에 httpOnly로 access token을 담는다. */
      res.cookie('accessToken', accessToken, { httpOnly: true });
      /* 로그인 성공시 루트로 돌려보냄 */
      res.redirect('/');
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }
}