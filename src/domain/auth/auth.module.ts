import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '~/src/domain/users/users.module';
import { JwtStrategy } from '~/src/domain/auth/strategies/jwt.strategy';
import { KakaoStrategy } from '~/src/domain/auth/strategies/kakao.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    JwtModule.registerAsync({
      imports:[ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60s' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    KakaoStrategy,
    JwtStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
