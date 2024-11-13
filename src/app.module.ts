import { Module } from '@nestjs/common';
import { UsersModule } from '~/src/domain/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '~/src/domain/auth/auth.module';
import { AuctionModule } from '~/src/domain/auction/auction.module';
import { FileModule } from './domain/file/file.module';
import { AwsModule } from './domain/aws/aws.module';
import { GameModule } from './domain/game/game.module';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@nestjs-modules/ioredis';

// 환경변수 유효성 검사 함수
const validateEnvVariables = (config: Record<string, any>) => {
  const requiredVars = ['REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD'];
  const missing = requiredVars.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
  return config;
};
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvVariables,
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => (
        console.log(
          'configService.getOrThrow<string>(REDIS_HOST): ',
          configService.getOrThrow<string>('REDIS_HOST'),
        ),
        {
          type: 'single',
          config: {
            host: configService.getOrThrow<string>('REDIS_HOST'),
            port: configService.getOrThrow<number>('REDIS_PORT'),
            password: configService.getOrThrow<string>('REDIS_PASSWORD'),
            username: 'default',
            db: configService.getOrThrow<number>('REDIS_DB', 0),
            keyPrefix: configService.getOrThrow<string>(
              'REDIS_PREFIX',
              'auction:',
            ),
            retryStrategy(times: number): number | null {
              if (times > 5) {
                return null;
              }
              return Math.min(times * 2000, 10000);
            },
            connectTimeout: 10000,
            commandTimeout: 5000,
            enableReadyCheck: true,
            enableAutoPipelining: true,
          },
        }
      ),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    AuctionModule,
    FileModule,
    AwsModule,
    GameModule,
  ],
})
export class AppModule {}
