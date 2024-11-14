import { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const redisConfig = (
  configService: ConfigService,
): RedisModuleOptions => ({
  type: 'single',
  options: {
    host: configService.getOrThrow<string>('REDIS_HOST'),
    port: configService.getOrThrow<number>('REDIS_PORT'),
    password: configService.getOrThrow<string>('REDIS_PASSWORD'),
    username: 'default',
    db: configService.getOrThrow<number>('REDIS_DB', 0),
    keyPrefix: configService.getOrThrow<string>('REDIS_PREFIX', 'auction:'),
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
});

export const bullqConfig = (configService: ConfigService) => ({
  redis: {
    host: configService.get<string>('REDIS_HOST'),
    port: configService.get<number>('REDIS_PORT'),
    password: configService.get<string>('REDIS_PASSWORD'),
  },
});

export const typeormConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  autoLoadEntities: true,
  synchronize: true,
});
