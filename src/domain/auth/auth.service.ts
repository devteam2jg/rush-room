import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';
import { UsersService } from '~/src/domain/users/users.service';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private jwtService: JwtService,
    ){}
    async login(user:UserDataDto) {
        const payload:JwtPayloadDto = { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          socialType: user.socialType
         };
        return this.jwtService.sign(payload);
    }
    async validateUser(payload: JwtPayloadDto) {
        const user:UserDataDto = await this.usersService.findById({
          id: payload.id
        });
        //TODO: 이부분의 exception 처리는 filter로 빼는게 좋을듯
        if(!user)
          throw new UnauthorizedException();
        return user;
    }
}
