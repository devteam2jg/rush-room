import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '~/src/domain/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from '~/src/domain/users/dto/user.dto';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';

@Injectable()
export class UserTestService {
  private readonly testThumbnailUrl;
  private readonly testProfileUrl;
  private readonly first = 1;
  private readonly last = 200;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.testProfileUrl = configService.get<string>('TEST_PROFILE_URL');
    this.testThumbnailUrl = configService.get<string>('TEST_THUMBNAIL_URL');
  }

  createTestUser() {
    for (let i = this.first; i <= this.last; i++) {
      const user: CreateUserDto = {
        name: `익명 사용자 ${i}`,
        email: `testuser${i}@rushroom.kr`,
        password: 'meanninglessoption',
        socialId: this.makeId(i),
        socialType: SocialType.TEST,
        profileUrl: this.testProfileUrl,
        thumbnailUrl: this.testThumbnailUrl,
      };
      this.usersRepository.save(user);
    }
  }
  makeId(i: number) {
    return `1000${i}`;
  }
  createMasterUser() {
    const user: CreateUserDto = {
      name: `마스터 사용자`,
      email: `master@rushroom.kr`,
      password: 'meanninglessoption',
      socialId: '1',
      socialType: SocialType.Master,
      profileUrl: this.testProfileUrl,
      thumbnailUrl: this.testThumbnailUrl,
    };
    this.usersRepository.save(user);
  }

  getFirstNum() {
    return this.first;
  }
  getLastNum() {
    return this.last;
  }
}
