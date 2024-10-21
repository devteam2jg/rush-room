import { Module } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { AuctionController } from './auction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { AuctionRepository } from '~/src/domain/auction/auction.repository';
import { AuctionManager } from '~/src/domain/auction/auction.manager';

@Module({
  imports: [TypeOrmModule.forFeature([Auction])],
  controllers: [AuctionController],
  providers: [AuctionService, AuctionRepository, AuctionManager],
})
export class AuctionModule {}
