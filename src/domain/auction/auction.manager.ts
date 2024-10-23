import { Injectable } from '@nestjs/common';
import { CreateAuctionDto } from '~/src/domain/auction/dto/create-auction.dto';
import { AuctionPolicy } from '~/src/domain/auction/auction.policy';
import {
  EntityNotFoundException,
  TooEarlyEventTimeException,
} from '~/src/common/exceptions/service.exception';
import { MINUTE, SECOND } from '~/src/common/constants/time.constants';
import { UserErrorMessage } from '~/src/common/messages/user.error.message';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { UpdateResult } from 'typeorm';
import { User } from '~/src/domain/users/entities/user.entity';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';

@Injectable()
export class AuctionManager {
  public validateCreateAuctionDto(createAuctionDto: CreateAuctionDto) {
    if (this.isEventTimeTooEarly(createAuctionDto.eventDate)) {
      throw TooEarlyEventTimeException(UserErrorMessage.TOO_EARLY_EVENT_TIME);
    }
  }

  public validateUser(user: User) {
    if (!user) throw EntityNotFoundException(`user not found in auction`);
  }

  public validateAuctionItem(auctionItem: AuctionItem) {
    if (!auctionItem)
      throw EntityNotFoundException(`auctionItem not found in auction`);
  }

  public validateId(id: string, auction: Auction) {
    if (!auction) throw EntityNotFoundException(`auction id ${id} not found`);
  }

  public checkAffected(result: UpdateResult) {
    if (result.affected === 0) throw EntityNotFoundException();
  }

  private isEventTimeTooEarly(eventDate: Date): boolean {
    const currentDate = new Date();
    const errorBound = 5 * SECOND;
    const min =
      currentDate.getTime() +
      AuctionPolicy.MIN_START_MINUTE * MINUTE -
      errorBound;

    return min > eventDate.getTime();
  }
}
