import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
/* nest 에서 cookie를 다루기위해 express모듈을 사용중임. */
import { Request } from 'express';
import { promises } from 'dns';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            /* cookie에 담긴 토큰을 추출 */
            jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => {
              let token = null;
              if (req && req.cookies) {
                token = req.cookies['accessToken'];
              }
              return token;
            }]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
          } as StrategyOptions);
    }

    async validate(payload: any):Promise<JwtPayloadDto> {
        return payload as JwtPayloadDto; //TODO: 이거 검증되는지 확인
    }
}