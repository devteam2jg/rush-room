import { Module } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { AuctionController } from './auction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { AuctionRepository } from '~/src/domain/auction/auction.repository';
import { AuctionManager } from '~/src/domain/auction/auction.manager';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';
import { AuctionItemRepository } from '~/src/domain/auction/auction-item.repository';
import { FileService } from '~/src/domain/file/file.service';
import { UsersService } from '~/src/domain/users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([Auction, AuctionItem])],
  controllers: [AuctionController],
  providers: [
    AuctionService,
    AuctionRepository,
    AuctionManager,
    AuctionItemRepository,
    FileService,
    UsersService,
  ],
})
export class AuctionModule {}
