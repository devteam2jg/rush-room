import { Test, TestingModule } from '@nestjs/testing';
import { AuctionService } from './auction.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateAuctionDto } from '~/src/domain/auction/dto/create-auction.dto';
import { AuctionRepository } from '~/src/domain/auction/auction.repository';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { UserErrorMessage } from '~/src/common/messages/user.error.message';
import { TooEarlyEventTimeException } from '~/src/common/exceptions/service.exception';
import { ReadAuctionDto } from '~/src/domain/auction/dto/read-auction.dto';
import { AuctionPolicy } from '~/src/domain/auction/auction.policy';
import { MINUTE } from '~/src/common/constants/time.constants';
import { AuctionManager } from '~/src/domain/auction/auction.manager';

export const auctionRepoFunctions = () => ({
  createAuction: jest.fn(),
  findAll: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const validEventTime = new Date(
  new Date().getTime() + AuctionPolicy.MIN_START_MINUTE * MINUTE,
);

describe('AuctionService', () => {
  let auctionService: AuctionService;
  let auctionRepository: AuctionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionService,
        {
          provide: getRepositoryToken(AuctionRepository),
          useValue: auctionRepoFunctions(),
        },
        AuctionManager,
      ],
    }).compile();

    auctionService = module.get<AuctionService>(AuctionService);
    auctionRepository = module.get<AuctionRepository>(AuctionRepository);
  });

  it('should be defined', () => {
    expect(auctionService).toBeDefined();
    expect(auctionRepository).toBeDefined();
  });

  it('SUCCESS(create): should create an auction', async () => {
    const createAuctionDto: CreateAuctionDto = {
      title: 'title',
      description: 'description',
      eventDate: validEventTime,
      sellingLimitTime: 10,
      userId: 'valid id',
    };
    const createdAuction = new Auction();
    Object.assign(createdAuction, createAuctionDto);

    jest
      .spyOn(auctionRepository, 'createAuction')
      .mockResolvedValue(createdAuction);

    const result = await auctionService.create(createAuctionDto);

    expect(auctionRepository.createAuction).toHaveBeenCalledWith(
      createAuctionDto,
    );
    expect(result).toEqual(createdAuction);
  });

  it('FAIL(create): invalid event time', async () => {
    const createAuctionDto: CreateAuctionDto = {
      title: 'updated title',
      description: 'updated description',
      eventDate: new Date(
        new Date().getTime() + (AuctionPolicy.MIN_START_MINUTE - 1) * MINUTE,
      ),
      sellingLimitTime: 20,
      userId: 'valid id',
    };
    jest.spyOn(auctionRepository, 'createAuction').mockResolvedValue(null);
    const result = async () => {
      await auctionService.create(createAuctionDto);
    };
    await expect(result).rejects.toThrow(
      TooEarlyEventTimeException(UserErrorMessage.TOO_EARLY_EVENT_TIME),
    );
  });

  it('should return all auctions', () => {
    const result = auctionService.findAll();
    expect(result).toEqual('This action returns all auction');
  });

  it('SUCCESS(read): should return a specific auction', async () => {
    const auction = {} as Auction;
    const readAuctionDto: ReadAuctionDto = {
      id: 'valid id',
      title: '',
      description: '',
      eventDate: new Date(),
      sellingLimitTime: 10,
      isEnd: false,
      isPrivate: false,
      createUserNickname: 'test user',
    };
    Object.assign(auction, readAuctionDto);
    jest.spyOn(auctionRepository, 'findOneBy').mockResolvedValue(auction);
    const result = await auctionService.findOne('1');
    expect(result).toEqual(readAuctionDto);
  });

  it('should remove an auction', () => {
    const result = auctionService.remove('1');
    expect(result).toEqual('This action removes a #1 auction');
  });
});
