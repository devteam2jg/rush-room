import { Test, TestingModule } from '@nestjs/testing';
import { AuctionService } from './auction.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateAuctionDto } from '~/src/domain/auction/dto/create-auction.dto';
import { AuctionRepository } from '~/src/domain/auction/auction.repository';
import { Auction, Status } from '~/src/domain/auction/entities/auction.entity';
import { UserErrorMessage } from '~/src/common/messages/user.error.message';
import { TooEarlyEventTimeException } from '~/src/common/exceptions/service.exception';
import { ReadAuctionDto } from '~/src/domain/auction/dto/read-auction.dto';
import { AuctionPolicy } from '~/src/domain/auction/auction.policy';
import { MINUTE } from '~/src/common/constants/time.constants';
import { AuctionManager } from '~/src/domain/auction/auction.manager';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { User } from '~/src/domain/users/entities/user.entity';
import { SocialType } from '~/src/domain/users/enum/social-type.enum';

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
  const user: JwtPayloadDto = {
    id: 'valid id',
    email: 'email',
    name: 'name',
    profileUrl: 'http',
    thumbnailUrl: 'http',
  };

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
    };
    let createdAuction = new Auction();
    Object.assign(createdAuction, createAuctionDto);
    const owner: User = {
      ...user,
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      socialId: '',
      socialType: SocialType.KAKAO,
      createdAt: new Date(),
      updatedAt: new Date(),
      auctions: [],
    } as User;
    createdAuction = { ...createdAuction, user: { ...owner } } as Auction;
    jest
      .spyOn(auctionRepository, 'createAuction')
      .mockResolvedValue({ createdAuctionId: createdAuction.id });

    const result = await auctionService.create(createAuctionDto, user);

    expect(auctionRepository.createAuction).toHaveBeenCalledWith(
      createAuctionDto,
      user,
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
    };
    jest.spyOn(auctionRepository, 'createAuction').mockResolvedValue(null);
    const result = async () => {
      await auctionService.create(createAuctionDto, user);
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
    const auction = { user } as Auction;
    const readAuctionDto: ReadAuctionDto = {
      auctionDto: {
        id: 'valid id',
        title: '',
        description: '',
        eventDate: new Date(),
        sellingLimitTime: 10,
        status: Status.WAIT,
        isPrivate: false,
        isOwner: true,
      },
      ownerProfile: {
        id: user.id,
        nickname: user.name,
        email: user.email,
        profileUrl: user.profileUrl,
        thumbnailUrl: user.thumbnailUrl,
      },
      items: [],
    };
    Object.assign(auction, readAuctionDto);
    Object.assign(auction, user);
    jest.spyOn(auctionRepository, 'findOneBy').mockResolvedValue(auction);
    const result = await auctionService.getAuctionDetail('1', user);
    expect(result).toEqual(readAuctionDto);
  });

  it('should remove an auction', () => {
    const result = auctionService.remove('1');
    expect(result).toEqual('This action removes a #1 auction');
  });
});
