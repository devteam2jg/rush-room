import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '~/src/domain/users/users.module';
import { JwtStrategy } from '~/src/domain/auth/strategies/jwt.strategy';
import { KakaoStrategy } from '~/src/domain/auth/strategies/kakao.strategy';
import { AuthController } from './auth.controller';
import { AuthTestController } from '~/src/domain/auth/test/test-auth.controller';
import { AuthTestService } from '~/src/domain/auth/test/test-auth.service';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],

  providers: [AuthService, KakaoStrategy, JwtStrategy, AuthTestService],
  controllers: [AuthController, AuthTestController],
})
export class AuthModule {}
