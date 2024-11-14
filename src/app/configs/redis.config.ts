import { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';

export const redisConfig = (
  configService: ConfigService,
): RedisModuleOptions => ({
  type: 'single',
  options: {
    host: configService.getOrThrow<string>('REDIS_HOST', 'localhost'),
    port: configService.getOrThrow<number>('REDIS_PORT', 6379),
    password: configService.getOrThrow<string>('REDIS_PASSWORD'),
    username: configService.get<string>('REDIS_USERNAME', 'default'),
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
