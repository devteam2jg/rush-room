import { PartialType } from '@nestjs/mapped-types';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';

export class JwtPayloadDto extends PartialType(UserDataDto) {}
