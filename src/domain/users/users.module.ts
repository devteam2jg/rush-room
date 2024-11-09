import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '~/src/domain/users/entities/user.entity';
import { UserTestService } from '~/src/domain/users/test/test-users.service';
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UserTestService],
  exports: [UsersService, UserTestService],
})
export class UsersModule {}
