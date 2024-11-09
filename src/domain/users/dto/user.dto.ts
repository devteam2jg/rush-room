import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';
import { PickType } from '@nestjs/swagger';
import { User } from '~/src/domain/users/entities/user.entity';

export class UserDataDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsString()
  socialId: string;
  @IsString()
  socialType: SocialType;

  @IsString()
  profileUrl: string;
  @IsString()
  thumbnailUrl: string;
}

export class UserProfileDto extends PickType(UserDataDto, [
  'id',
  'email',
  'profileUrl',
  'thumbnailUrl',
] as const) {
  nickname: string;

  constructor(user: User) {
    super();
    this.id = user.id;
    this.nickname = user.name;
    this.email = user.email;
    this.profileUrl = user.profileUrl;
    this.thumbnailUrl = user.thumbnailUrl;
  }
}

export class FindByDto extends PartialType(UserDataDto) {}

export class CreateUserDto extends PartialType(UserDataDto) {
  // @IsNotEmpty()
  // @IsString()
  // name: string;

  // @IsNotEmpty()
  // @IsString()
  // email: string;

  // @IsString()
  // socialId: string;
  // @IsString()
  // socialType: SocialType;

  // @IsString()
  // profileUrl: string;
  // @IsString()
  // thumbnailUrl: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  endorsedAuctions?: string[];
}
