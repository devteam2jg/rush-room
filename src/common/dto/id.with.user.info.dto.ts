import { IsNotEmpty, IsUUID } from 'class-validator';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';

export class IdWithUserInfoDto {
  @IsNotEmpty()
  @IsUUID()
  targetId: string;

  @IsNotEmpty()
  clientUser: JwtPayloadDto;

  constructor(targetId: string, clientUser: JwtPayloadDto) {
    this.targetId = targetId;
    this.clientUser = clientUser;
  }
}
