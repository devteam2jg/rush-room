import { Controller, Get } from '@nestjs/common';
import { AuthTestService } from '~/src/domain/auth/test/test-auth.service';
@Controller('auth-test')
export class AuthTestController {
  constructor(private readonly authTestService: AuthTestService) {}
  @Get('create')
  createTestUser() {
    return this.authTestService.createTestUser();
  }
  @Get('login')
  login() {
    return this.authTestService.testLogin();
  }
  @Get('logout')
  logout() {
    return this.authTestService.testLogout();
  }
}
