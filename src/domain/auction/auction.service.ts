import { Injectable } from '@nestjs/common';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { AuctionRepository } from '~/src/domain/auction/auction.repository';
import { ReadAuctionDto } from '~/src/domain/auction/dto/read-auction.dto';
import { AuctionManager } from '~/src/domain/auction/auction.manager';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { UpdateResult } from 'typeorm';
import { CreateAuctionResultDto } from '~/src/domain/auction/dto/create-auction-result.dto';
import { CreateAuctionItemDto } from '~/src/domain/auction/dto/auction-item/create.auction.item.dto';
import { AuctionItemRepository } from '~/src/domain/auction/auction-item.repository';
import { ReadAuctionItemDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.dto';
import { ReadAuctionItemDetailDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.detail.dto';
import { CreateAuctionItemResultDto } from '~/dist/src/domain/auction/dto/create.auction.item.result.dto';

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

  findAll() {
    return `This action returns all auction`;
  }

  async findOne(
    id: string,
    clientUser: JwtPayloadDto,
  ): Promise<ReadAuctionDto> {
    const auction: Auction = await this.getAuctionById(id);

    this.auctionManager.validateUser(auction.user);

    const auctionItems =
      await this.auctionItemRepository.getAuctionItemsByAuctionId(id);
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
    auctionItemId: string,
  ): Promise<ReadAuctionItemDetailDto> {
    const auctionItem =
      await this.auctionItemRepository.getAuctionItemById(auctionItemId);
    this.auctionManager.validateAuctionItem(auctionItem);
    return new ReadAuctionItemDetailDto(auctionItem, auctionItem.user);
  }
}
