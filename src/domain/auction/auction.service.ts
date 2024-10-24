import { Injectable } from '@nestjs/common';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { AuctionRepository } from '~/src/domain/auction/auction.repository';
import { ReadAuctionDto } from '~/src/domain/auction/dto/read-auction.dto';
import { AuctionManager } from '~/src/domain/auction/auction.manager';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { FindOptionsWhere, Repository, UpdateResult } from 'typeorm';
import { CreateAuctionResultDto } from '~/src/domain/auction/dto/create-auction-result.dto';
import { CreateAuctionItemDto } from '~/src/domain/auction/dto/auction-item/create.auction.item.dto';
import { AuctionItemRepository } from '~/src/domain/auction/auction-item.repository';
import { ReadAuctionItemDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.dto';
import { ReadAuctionItemDetailDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.detail.dto';
import { CreateAuctionItemResultDto } from '~/src/domain/auction/dto/auction-item/create.auction.item.result.dto';
import { PaginationRequest } from '~/src/common/pagination/pagination.request';
import { PaginationResponseBuilder } from '~/src/common/pagination/pagination.response.builder';
import { PaginationResponse } from '~/src/common/pagination/pagination.response';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';

@Injectable()
export class AuctionService {
  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly auctionItemRepository: AuctionItemRepository,
    private readonly auctionManager: AuctionManager,
  ) {}

  create(
    createAuctionDto: CreateAuctionDto,
    owner: JwtPayloadDto,
  ): Promise<CreateAuctionResultDto> {
    this.auctionManager.validateCreateAuctionDto(createAuctionDto);
    return this.auctionRepository.createAuction(createAuctionDto, owner);
  }

  async fetchPaginatedData<T, R>(
    repository: Repository<any>,
    paginationReq: PaginationRequest,
    options: FindOptionsWhere<any>,
    DtoClass: new (entity: T) => R,
  ): Promise<PaginationResponse<R>> {
    const [entities, total] = await repository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: paginationReq.skip(),
      take: paginationReq.take(),
      where: options,
    });
    const readEntities = entities.map((entity: T) => new DtoClass(entity));
    return new PaginationResponseBuilder<R>()
      .setData(readEntities)
      .setPage(paginationReq.page())
      .setTake(paginationReq.take())
      .setTotalCount(total)
      .build();
  }

  async getPaginatedAuctions(
    paginationReq: PaginationRequest,
    userId?: string,
  ): Promise<PaginationResponse<ReadAuctionDto>> {
    const options: FindOptionsWhere<Auction> = userId
      ? { user: { id: userId } }
      : {};
    return this.fetchPaginatedData<Auction, ReadAuctionDto>(
      this.auctionRepository,
      paginationReq,
      options,
      ReadAuctionDto,
    );
  }

  async getPaginatedAuctionItems(
    paginationReq: PaginationRequest,
    buyerId: string,
  ): Promise<PaginationResponse<ReadAuctionItemDto>> {
    const options: FindOptionsWhere<AuctionItem> = { isSold: true, buyerId };
    return this.fetchPaginatedData<AuctionItem, ReadAuctionItemDto>(
      this.auctionItemRepository,
      paginationReq,
      options,
      ReadAuctionItemDto,
    );
  }

  async findOne(
    id: string,
    clientUser: JwtPayloadDto,
  ): Promise<ReadAuctionDto> {
    const auction: Auction = await this.getAuctionById(id);

    this.auctionManager.validateUser(auction.user);

    const auctionItems =
      await this.auctionItemRepository.getAuctionItemsByAuctionIdAndItemId(
        id,
        null,
      );
    const readAuctionItems: ReadAuctionItemDto[] = auctionItems.map(
      (item) => new ReadAuctionItemDto(item, item.user),
    );

    return new ReadAuctionDto(
      auction,
      auction.user,
      clientUser,
      readAuctionItems,
    );
  }

  async update(
    id: string,
    updateAuctionDto: UpdateAuctionDto,
    owner: JwtPayloadDto,
  ): Promise<UpdateResult> {
    const result = await this.auctionRepository.update(
      { id: id, user: { id: owner.id } },
      updateAuctionDto,
    );
    this.auctionManager.checkAffected(result);
    return result;
  }

  remove(id: string) {
    return `This action removes a #${id} auction`;
  }

  async getAuctionById(id: string) {
    const auction = await this.auctionRepository.findOneBy({ id });
    this.auctionManager.validateId(id, auction);
    return auction;
  }

  async createAuctionItem(
    auctionId: string,
    createAuctionItemDto: CreateAuctionItemDto,
    clientUser: JwtPayloadDto,
  ): Promise<CreateAuctionItemResultDto> {
    await this.getAuctionById(auctionId);
    const result = await this.auctionItemRepository.createAuctionItem(
      auctionId,
      createAuctionItemDto,
      clientUser,
    );
    return new CreateAuctionItemResultDto(result);
  }

  async findAuctionItemById(
    auctionId: string,
    auctionItemId: string,
  ): Promise<ReadAuctionItemDetailDto> {
    const auctionItems =
      await this.auctionItemRepository.getAuctionItemsByAuctionIdAndItemId(
        auctionId,
        auctionItemId,
      );
    const auctionItem = auctionItems[0];
    this.auctionManager.validateAuctionItem(auctionItem);
    return new ReadAuctionItemDetailDto(auctionItem, auctionItem.user);
  }
}
