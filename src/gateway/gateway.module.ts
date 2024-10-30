import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionGateway } from './gateway';
import { AuctionGatewayService } from './gateway.service';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { AuctionManager } from '~/src/domain/auction/auction.manager';
import { AuctionItemRepository } from '~/src/domain/auction/auction-item.repository';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';
import { User } from '~/src/domain/users/entities/user.entity';
import { AuctionModule } from '~/src/domain/auction/auction.module';
import { UsersModule } from '~/src/domain/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, AuctionItem, User]),
    AuctionModule,
    UsersModule,
  ],
  providers: [
    AuctionGateway,
    AuctionGatewayService,
    AuctionService,
    AuctionManager,
    AuctionItemRepository,
  ],
  exports: [AuctionGatewayService],
})
export class GatewayModule {}
