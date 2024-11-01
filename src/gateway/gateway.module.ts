import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionItemBidService } from './item/auctionItemBid.service';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { AuctionManager } from '~/src/domain/auction/auction.manager';
import { AuctionItemRepository } from '~/src/domain/auction/auction-item.repository';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';
import { User } from '~/src/domain/users/entities/user.entity';
import { AuctionModule } from '~/src/domain/auction/auction.module';
import { UsersModule } from '~/src/domain/users/users.module';
import { AuctionChatGateway } from '~/src/gateway/chat/auctionChat.gateway';
import { AuctionChatService } from '~/src/gateway/chat/auctionChat.service';
import { AuctionItemBidGateway } from '~/src/gateway/item/auctionItemBid.gateway';
import { AuctionJoinGateway } from '~/src/gateway/join/auctionJoin.gateway';
import { AuctionJoinService } from '~/src/gateway/join/auctionJoin.service';
import { AuctionNotificationService } from '~/src/gateway/notification/auctionNotification.service';
import { AuctionNotificationGateway } from '~/src/gateway/notification/auctionNotification.gateway';
import { Server } from 'socket.io';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, AuctionItem, User]),
    AuctionModule,
    UsersModule,
  ],
  providers: [
    AuctionChatGateway,
    AuctionChatService,
    AuctionItemBidGateway,
    AuctionItemBidService,
    AuctionJoinGateway,
    AuctionJoinService,
    AuctionNotificationGateway,
    AuctionNotificationService,
    AuctionItemRepository,
    AuctionService,
    AuctionManager,
    Server,
  ],
  exports: [AuctionService],
})
export class GatewayModule {}
