import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthTestService } from '~/src/domain/auth/test/test-auth.service';
@Controller('auth-test')
export class AuthTestController {
  constructor(
    private readonly authTestService: AuthTestService,
    private readonly configService: ConfigService,
  ) {}
  @Get('create')
  createTestUser() {
    this.authTestService.createTestUser();
    return 'create test user';
  }
  @Get('login')
  async login(@Query('url') url, @Req() req, @Res() res) {
    const accessToken = await this.authTestService.testLogin();
    if (!accessToken) return 'test user is not available';
    res.cookie('accessToken', accessToken, { httpOnly: true });
    if (url) {
      res.redirect(url);
      return;
    }
    res.redirect(this.configService.get<string>('LOGIN_REDIRECT_URL'));
  }
  @Get('logout')
  logout() {
    this.authTestService.testLogout();
  }
}
