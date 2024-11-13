import { Injectable } from '@nestjs/common';
import { AuthService } from '~/src/domain/auth/auth.service';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';
import { UserTestService } from '~/src/domain/users/test/test-users.service';
import { UsersService } from '~/src/domain/users/users.service';

@Injectable()
export class AuthTestService {
  private loginedUser: boolean[];
  constructor(
    private readonly userTestService: UserTestService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    const userCount =
      this.userTestService.getLastNum() -
      this.userTestService.getFirstNum() +
      1;
    this.loginedUser = new Array(userCount).fill(true);
  }

  createTestUser() {
    this.userTestService.createTestUser();
  }
  async testLogin() {
    const id = this.findReachableTestUser();
    if (!id) {
      return null;
    }
    const user = await this.usersService.findBySocialId({ socialId: id });
    return this.authService.login(user);
  }
  findReachableTestUser() {
    const first = this.userTestService.getFirstNum();
    const last = this.userTestService.getLastNum() + 1;
    for (let i = first; i < last; i++) {
      if (this.loginedUser[i - first]) {
        this.loginedUser[i - first] = false; // 사용자를 로그인 상태로 변경
        return this.userTestService.makeId(i);
      }
    }
    return null;
  }
  testLogout() {
    this.loginedUser.fill(true);
  }
  async loginMaster() {
    const user = await this.usersService.findBySocialId({
      socialType: SocialType.Master,
    });
    return this.authService.login(user);
  }
}
