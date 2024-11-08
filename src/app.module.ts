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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'bid-queue', // 호출 함수가 담길 큐
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
