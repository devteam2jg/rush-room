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
    private jwtService: JwtService,
  ) {}

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
  async validateUser(payload: JwtPayloadDto): Promise<UserDataDto> {
    const { id } = payload;
    return await this.usersService.findById({ id } as FindByDto);
  }
  /* TODO: 로직 분리 */
  async validateSocialUser(profile: SocialProfileDto): Promise<UserDataDto> {
    const { socialId, socialType } = profile;
    const user: UserDataDto = await this.usersService.findBySocialId({
      socialId,
      socialType,
    } as FindByDto);
    if (user) await this.updateSocialUser(profile);
    return user;
  }
  async updateSocialUser(profile: SocialProfileDto): Promise<void> {
    const { name, profileUrl, thumbnailUrl } = profile;
    this.usersService.update({
      name,
      profileUrl,
      thumbnailUrl,
    } as UpdateUserDto);
  }
}