import { Injectable } from '@nestjs/common';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { AuctionRepository } from '~/src/domain/auction/auction.repository';
import { ReadAuctionDto } from '~/src/domain/auction/dto/read-auction.dto';
import { AuctionManager } from '~/src/domain/auction/auction.manager';

@Injectable()
export class AuctionService {
  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly auctionManager: AuctionManager,
  ) {}

  create(createAuctionDto: CreateAuctionDto) {
    this.auctionManager.validateCreateAuctionDto(createAuctionDto);
    return this.auctionRepository.createAuction(createAuctionDto);
  }

  findAll() {
    return `This action returns all auction`;
  }

  async findOne(id: string) {
    const auction = await this.getAuctionById(id);
    const readAuctionDto = {} as ReadAuctionDto;
    Object.assign(readAuctionDto, auction);
    return readAuctionDto;
  }

  async update(id: string, updateAuctionDto: UpdateAuctionDto) {
    const result = await this.auctionRepository.update(
      { id },
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
