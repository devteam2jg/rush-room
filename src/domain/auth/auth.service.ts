import { Injectable } from '@nestjs/common';
import { UserDataDto, CreateUserDto } from '~/src/domain/users/dto/user.dto';
import { UsersService } from '~/src/domain/users/users.service';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { JwtService } from '@nestjs/jwt';
import {
  FindByIdDto,
  FindBySocialIdDto,
} from '~/src/domain/users/dto/user.dto';
import { SocialProfileDto } from '~/src/domain/auth/dto/social-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(user: UserDataDto): Promise<string> {
    const payload: JwtPayloadDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      socialType: user.socialType,
    };
    return this.jwtService.sign(payload);
  }
  async createSocialUser(profile: SocialProfileDto): Promise<UserDataDto> {
    return this.usersService.create({
      name: profile.name,
      /*TODO: password 관련 로직 변경 필요, but 소셜로그인 단계에서는 password관련 로직이 하나도 없기에 일단 방치해도 됨. */
      password: '!@#$!$%@#',
      email: profile.email,
      socialId: profile.socialId,
      socialType: profile.socialType,
      profile_url: profile.profileUrl,
      thumbnail_url: profile.thumbnailUrl,
    } as CreateUserDto);
  }
  async validateUser(payload: JwtPayloadDto): Promise<UserDataDto> {
    return await this.usersService.findById(payload as FindByIdDto);
  }
  async validateSocialUser(profile: SocialProfileDto): Promise<UserDataDto> {
    return await this.usersService.findBySocialId(profile as FindBySocialIdDto);
  }
}
