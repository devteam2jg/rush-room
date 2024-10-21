import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '~/src/domain/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateUserDto,
  FindByDto,
  UserDataDto,
} from '~/src/domain/users/dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user: User = await this.usersRepository.save(createUserDto);
    return this.makeUserDto(user);
  }
  async findById(findByIdDto: FindByDto) {
    const { id } = findByIdDto;
    const user = await this.usersRepository.findOne({
      where: { id: id },
    });
    return this.makeUserDto(user);
  }

  async findBySocialId(findBySocialIdDto: FindByDto) {
    const { socialId, socialType } = findBySocialIdDto;
    const user: User = await this.usersRepository.findOne({
      where: { socialId, socialType },
    });
    if (!user) {
      return null;
    }
    return this.makeUserDto(user);
  }
  makeUserDto(user: User) {
    const { id, name, email, socialId, socialType, profileUrl, thumbnailUrl } =
      user;
    const userDataDto: UserDataDto = {
      id,
      name,
      email,
      socialId,
      socialType,
      profileUrl,
      thumbnailUrl,
    };
    return userDataDto;
  }
}
