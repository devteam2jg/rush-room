import { Test, TestingModule } from '@nestjs/testing';
import { AuctionController } from './auction.controller';
import { AuctionService } from '~/src/domain/auction/auction.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuctionRepository } from '~/src/domain/auction/auction.repository';
import { AuctionManager } from '~/src/domain/auction/auction.manager';

describe('AuctionController', () => {
  let controller: AuctionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuctionController],
      providers: [
        AuctionService,
        {
          provide: getRepositoryToken(AuctionRepository),
          useValue: {},
        },
        AuctionManager,
      ],
    }).compile();

    controller = module.get<AuctionController>(AuctionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
