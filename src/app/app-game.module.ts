import { Module } from '@nestjs/common';
import { UsersModule } from '~/src/domain/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '~/src/domain/auth/auth.module';
import { AuctionModule } from '~/src/domain/auction/auction.module';
import { FileModule } from '../domain/file/file.module';
import { AwsModule } from '../domain/aws/aws.module';
import { GameModule } from '../domain/game/game.module';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@nestjs-modules/ioredis';
import { bullqConfig, redisConfig, typeormConfig } from '~/src/app/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: redisConfig,
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: bullqConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: typeormConfig,
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
export class GameAppModule {}
