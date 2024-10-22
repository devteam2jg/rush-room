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

@Injectable()
export class AuctionService {
  constructor(
    private readonly auctionRepository: AuctionRepository,
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
    return new ReadAuctionDto(auction, auction.user, clientUser);
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
}
