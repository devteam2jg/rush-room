import { Injectable } from '@nestjs/common';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { AuctionRepository } from '~/src/domain/auction/auction.repository';
import {
  AuctionDto,
  ReadAuctionDto,
  ReadAuctionDtoBuilder,
} from '~/src/domain/auction/dto/read-auction.dto';
import { AuctionManager } from '~/src/domain/auction/auction.manager';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { FindOptionsWhere, Repository, UpdateResult } from 'typeorm';
import { CreateAuctionResultDto } from '~/src/domain/auction/dto/create-auction-result.dto';
import { AuctionItemRepository } from '~/src/domain/auction/auction-item.repository';
import { ReadAuctionItemDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.dto';
import { ReadAuctionItemDetailDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.detail.dto';
import { CreateAuctionItemResultDto } from '~/src/domain/auction/dto/auction-item/create.auction.item.result.dto';
import { PaginationRequest } from '~/src/common/pagination/pagination.request';
import { PaginationResponseBuilder } from '~/src/common/pagination/pagination.response.builder';
import { PaginationResponse } from '~/src/common/pagination/pagination.response';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';
import { UpdateAuctionItemDto } from '~/src/domain/auction/dto/update.auction.item.dto';
import { AuctionIdsWithJwtPayload } from '~/src/common/dto/auctionIdsWithJwtPayload';
import { CreateAuctionServiceDto } from '~/src/domain/auction/dto/service/create.auction.service.dto';
import { UsersService } from '~/src/domain/users/users.service';
import { EnterPrivateAuctionServiceDto } from '~/src/domain/auction/dto/auction/enter.private.auction.service.dto';

@Injectable()
export class AuctionService {
  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly auctionItemRepository: AuctionItemRepository,
    private readonly auctionManager: AuctionManager,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createAuctionDto: CreateAuctionDto,
    owner: JwtPayloadDto,
  ): Promise<CreateAuctionResultDto> {
    this.auctionManager.validateCreateAuctionDto(createAuctionDto);
    await this.usersService.findById({ id: owner.id });
    return this.auctionRepository.createAuction(createAuctionDto, owner);
  }

  async getAuctionDetail(
    auctionId: string,
    clientUser: JwtPayloadDto,
  ): Promise<ReadAuctionDto> {
    const auction: Auction = await this.getAuctionById(auctionId);

    if (await this.isUnEndorsed(auction, clientUser)) {
      return new ReadAuctionDtoBuilder()
        .setPrivateAuctionDto(auction)
        .setOwnerProfile(auction.user)
        .setReadUser(auction.user, clientUser, false)
        .build();
    }

    const auctionItems =
      await this.auctionItemRepository.getAuctionItemsByAuctionIdAndItemId(
        auctionId,
      );

    const readAuctionItems: ReadAuctionItemDto[] = auctionItems.map(
      (item) => new ReadAuctionItemDto(item, item.user),
    );

    return new ReadAuctionDtoBuilder()
      .setAuctionDto(auction)
      .setOwnerProfile(auction.user)
      .setReadUser(auction.user, clientUser, true)
      .setItems(readAuctionItems)
      .build();
  }

  async enterPrivate(
    enterPrivateAuctionServiceDto: EnterPrivateAuctionServiceDto,
  ) {
    const auction = await this.getAuctionById(
      enterPrivateAuctionServiceDto.auctionId,
    );
    this.auctionManager.validatePrivateCode(
      enterPrivateAuctionServiceDto,
      auction,
    );
    await this.usersService.updateEndorsedAuction(
      enterPrivateAuctionServiceDto,
    );

    return true;
  }

  async getPaginatedAuctions(
    paginationReq: PaginationRequest,
    userId?: string,
  ): Promise<PaginationResponse<ReadAuctionDto>> {
    const options: FindOptionsWhere<Auction> = userId
      ? { user: { id: userId } }
      : {};
    const paginatedResult = await this.fetchPaginatedData<Auction, AuctionDto>(
      this.auctionRepository,
      paginationReq,
      options,
      AuctionDto,
    );
    const readAuctionDtos = paginatedResult.data.map((auctionDto) => {
      return new ReadAuctionDtoBuilder()
        .setAuctionDto(auctionDto as Auction)
        .setOwnerProfile(auctionDto.user)
        .setItems(auctionDto.auctionItems)
        .build();
    });
    return {
      ...paginatedResult,
      data: readAuctionDtos,
    } as PaginationResponse<ReadAuctionDto>;
  }

  private async isUnEndorsed(auction: Auction, clientUser: JwtPayloadDto) {
    const isNotOwner = auction.user.id !== clientUser.id;
    const isEndorsed = await this.usersService.checkUserEndorsedInAuction(
      clientUser.id,
      auction.id,
    );
    if (isEndorsed) return false;
    return auction.isPrivate && isNotOwner;
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

  async updateAuctionItem(
    auctionId: string,
    auctionItemId: string,
    updateAuctionItemDto: UpdateAuctionItemDto,
    clientUser: JwtPayloadDto,
  ) {
    const auctionItem = await this.auctionItemRepository
      .getAuctionItemsByAuctionIdAndItemId(auctionId, auctionItemId)
      .then((auctionItems) => auctionItems[0]);
    this.auctionManager.authorityCheck(auctionItem, clientUser);

    const result = await this.auctionItemRepository.update(
      { id: auctionItemId },
      updateAuctionItemDto,
    );

    this.auctionManager.checkAffected(result);
    return result;
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

  async remove(auctionId: string, clientUser: JwtPayloadDto) {
    const auction: Auction = await this.getAuctionById(auctionId);
    this.auctionManager.authorityCheck(auction, clientUser);
    await this.auctionRepository.remove(auction);
    return true;
  }

  async getAuctionItem(
    auctionId: string,
    auctionItemId: string,
  ): Promise<ReadAuctionItemDetailDto> {
    const auctionItems =
      await this.auctionItemRepository.getAuctionItemsByAuctionIdAndItemId(
        auctionId,
        auctionItemId,
      );
    const auctionItem = auctionItems[0];
    this.auctionManager.validateId(auctionItem);
    return new ReadAuctionItemDetailDto(auctionItem, auctionItem.user);
  }

  async createAuctionItem(
    createAuctionServiceDto: CreateAuctionServiceDto,
  ): Promise<CreateAuctionItemResultDto> {
    const auctionId = createAuctionServiceDto.auctionIds.auctionId;
    await this.getAuctionById(auctionId);
    await this.usersService.findById({
      id: createAuctionServiceDto.clientUser.id,
    });
    const result = await this.auctionItemRepository.createAuctionItem(
      createAuctionServiceDto,
    );
    return new CreateAuctionItemResultDto(result);
  }

  private async fetchPaginatedData<T, R>(
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

  private async getAuctionById(id: string) {
    const auction = await this.auctionRepository.findOneBy({ id });
    this.auctionManager.validateId(auction);
    return auction;
  }

  async removeItem(removeItemServiceDto: AuctionIdsWithJwtPayload) {
    const auctionId = removeItemServiceDto.auctionIds.auctionId;
    const auctionItemId = removeItemServiceDto.auctionIds.auctionItemId;
    const auctionItem = await this.auctionItemRepository
      .getAuctionItemsByAuctionIdAndItemId(auctionId, auctionItemId)
      .then((auctionItems) => auctionItems[0]);
    this.auctionManager.authorityCheck(
      auctionItem,
      removeItemServiceDto.clientUser,
    );
    await this.auctionItemRepository.remove(auctionItem);
    return true;
  }

  async isOwner(auctionId: string, userId: string): Promise<boolean> {
    const auction = await this.auctionRepository.findOneBy({ id: auctionId });
    return auction.user.id == userId;
  }
}
