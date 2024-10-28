import { Injectable } from '@nestjs/common';
import { CreateAuctionDto } from '~/src/domain/auction/dto/create-auction.dto';
import { AuctionPolicy } from '~/src/domain/auction/auction.policy';
import {
  EntityNotFoundException,
  ForbiddenBehaviorException,
  TooEarlyEventTimeException,
} from '~/src/common/exceptions/service.exception';
import { MINUTE, SECOND } from '~/src/common/constants/time.constants';
import { UserErrorMessage } from '~/src/common/messages/user.error.message';
import { Auction } from '~/src/domain/auction/entities/auction.entity';
import { UpdateResult } from 'typeorm';
import { User } from '~/src/domain/users/entities/user.entity';
import { AuctionItem } from '~/src/domain/auction/entities/auction-item.entity';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { EnterPrivateAuctionServiceDto } from '~/src/domain/auction/dto/auction/enter.private.auction.service.dto';

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

  public validateId(entity: Auction | AuctionItem) {
    if (!entity?.id) throw EntityNotFoundException(`id ${entity.id} not found`);
  }

  public checkAffected(result: UpdateResult) {
    if (result.affected === 0) throw EntityNotFoundException();
  }

  public authorityCheck(
    auctionEntity: Auction | AuctionItem,
    clientUser: JwtPayloadDto,
  ) {
    if (auctionEntity.user.id !== clientUser.id) {
      throw ForbiddenBehaviorException(
        'user can only remove or update their auction',
      );
    }
  }

  public validatePrivateCode(
    getAuctionPasswordDto: EnterPrivateAuctionServiceDto,
    auction: Auction,
  ) {
    if (getAuctionPasswordDto.userPrivateCode !== auction.privateCode) {
      throw ForbiddenBehaviorException('private code is wrong');
    }
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
