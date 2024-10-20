import { Injectable} from '@nestjs/common';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';
import { UsersService } from '~/src/domain/users/users.service';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { JwtService } from '@nestjs/jwt';
import { FindByIdDto } from '~/src/domain/users/dto/user.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private jwtService: JwtService,
    ){}
    async login(user:UserDataDto):Promise<string> {
        const payload:JwtPayloadDto = { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          socialType: user.socialType
         };
        return this.jwtService.sign(payload);
    }
    async validateUser(payload: JwtPayloadDto) : Promise<UserDataDto> {
        return await this.usersService.findById(payload as FindByIdDto);
    }
}
