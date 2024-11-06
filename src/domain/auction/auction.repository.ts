import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Auction, Status } from '~/src/domain/auction/entities/auction.entity';
import { CreateAuctionDto } from '~/src/domain/auction/dto/create-auction.dto';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { CreateAuctionResultDto } from '~/src/domain/auction/dto/create-auction-result.dto';
import { UserDataDto } from '~/src/domain/users/dto/user.dto';

@Injectable()
export class AuctionRepository extends Repository<Auction> {
  constructor(private readonly dataSource: DataSource) {
    super(Auction, dataSource.createEntityManager());
  }

  async createAuction(
    createAuctionDto: CreateAuctionDto,
    owner: JwtPayloadDto,
  ): Promise<CreateAuctionResultDto> {
    const auction = this.create({
      ...createAuctionDto,
      user: { id: owner.id },
    });
    const result = await this.save(auction);

    return { createdAuctionId: result.id };
  }

  async updateJoinedUsers(auctionId: string, joinedUsers: UserDataDto[]) {
    return await this.dataSource
      .createQueryBuilder()
      .update(Auction)
      .set({ joinedUsers: joinedUsers })
      .where('id = :auctionId', { auctionId })
      .execute();
  }

  // status가 WAIT인 경매 리스트 가져오기
  async getWaitAuctions(): Promise<Auction[]> {
    return this.createQueryBuilder('auction')
      .where('auction.status = :status', { status: Status.WAIT })
      .getMany();
  }
}
