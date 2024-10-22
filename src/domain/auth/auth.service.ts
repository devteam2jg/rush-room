import { Injectable } from '@nestjs/common';
import {
  UserDataDto,
  CreateUserDto,
  FindByDto,
  UpdateUserDto,
} from '~/src/domain/users/dto/user.dto';
import { UsersService } from '~/src/domain/users/users.service';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { JwtService } from '@nestjs/jwt';
import { SocialProfileDto } from '~/src/domain/auth/dto/social-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   *
   * @param user
   *
   * @returns
   */
  async login(user: UserDataDto): Promise<string> {
    const { id, name, email, socialType } = user;
    const payload: JwtPayloadDto = {
      id,
      name,
      email,
      socialType,
    };
    return this.jwtService.sign(payload);
  }

  /**
   *
   * @param profile
   * @returns
   */
  async createSocialUser(profile: SocialProfileDto): Promise<UserDataDto> {
    const { id, name, email, socialId, socialType, profileUrl, thumbnailUrl } =
      profile;
    return this.usersService.create({
      id,
      name,
      password: 'NOT_DEFINED',
      email,
      socialId,
      socialType,
      profileUrl,
      thumbnailUrl,
    } as CreateUserDto);
  }

  /*
   * 이 함수는 JwtPayloadDto를 받아서 해당 유저가 존재하는지 확인합니다.
   * 존재한다면 해당 유저의 정보를 반환하고, 존재하지 않는다면 null을 반환합니다.
   */
  async validateUser(payload: JwtPayloadDto): Promise<UserDataDto> {
    const { id } = payload;
    return await this.usersService.findById({ id } as FindByDto);
  }

  /*
   * 이 함수는 SocialProfileDto를 받아서 해당 유저가 존재하는지 확인합니다.
   * 존재한다면 해당 유저의 정보를 반환하고, 존재하지 않는다면 null을 반환합니다.
   */
  async validateSocialUser(profile: SocialProfileDto): Promise<UserDataDto> {
    const { socialId, socialType } = profile;
    return await this.usersService.findBySocialId({
      socialId,
      socialType,
    } as FindByDto);
  }

  /*
   * 이 함수는 SocialProfileDto를 받아서 해당 유저의 정보를 업데이트합니다.
   */
  async updateSocialUser(id: string, profile: SocialProfileDto): Promise<void> {
    const { name, profileUrl, thumbnailUrl } = profile;
    this.usersService.update({
      id,
      name,
      profileUrl,
      thumbnailUrl,
    } as UpdateUserDto);
  }

  /*
   * 이 함수는 SocialProfileDto를 받아서 해당 유저가 존재하면 로그인하고, 존재하지 않으면 유저를 생성한 후 로그인합니다.
   */
  async loginSocialUser(profile: SocialProfileDto): Promise<string> {
    let user: UserDataDto;
    user = await this.validateSocialUser(profile);
    if (user) {
      const { id } = user;
      await this.updateSocialUser(id, profile);
    } else user = await this.createSocialUser(profile);
    return this.login(user);
  }
}
