import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuctionService } from './auction.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { JwtAuthGuard } from '~/src/domain/auth/guards/auth.guard';
import { GetJwtPayload } from '~/src/domain/users/get-user.decorator';
import { JwtPayloadDto } from '~/src/domain/auth/dto/jwt.dto';
import { CreateAuctionResultDto } from '~/src/domain/auction/dto/create-auction-result.dto';
import { ReadAuctionDto } from '~/src/domain/auction/dto/read-auction.dto';

@Controller('auction')
@UseGuards(JwtAuthGuard)
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Post()
  create(
    @Body() createAuctionDto: CreateAuctionDto,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ): Promise<CreateAuctionResultDto> {
    return this.auctionService.create(createAuctionDto, jwtPayload);
  }

  @Get()
  findAll() {
    return this.auctionService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ): Promise<ReadAuctionDto> {
    return this.auctionService.findOne(id, jwtPayload);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAuctionDto: UpdateAuctionDto,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ) {
    return this.auctionService.update(id, updateAuctionDto, jwtPayload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auctionService.remove(id);
  }
}
