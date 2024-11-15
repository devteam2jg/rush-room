import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisTestService implements OnModuleInit {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');
    const pass = this.configService.get<string>('REDIS_PASSWORD');
    console.log(host, port, pass);
    this.redisClient = new Redis({
      host,
      port,
      password: pass,
    });

    this.redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    this.testConnection();
  }

  async testConnection() {
    try {
      await this.redisClient.set('test-key', 'test-value');
      const value = await this.redisClient.get('test-key');
      console.log('Redis test value:', value);
    } catch (err) {
      console.error('Redis connection test failed:', err);
    }
  }
}
