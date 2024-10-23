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
import { CreateAuctionItemDto } from '~/src/domain/auction/dto/auction-item/create.auction.item.dto';
import { CreateAuctionItemResultDto } from '~/src/domain/auction/dto/auction-item/create.auction.item.result.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReadAuctionItemDetailDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.detail.dto';

@ApiTags('Auction apis')
@UseGuards(JwtAuthGuard)
@Controller('auction')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Post()
  @ApiOperation({ summary: 'Create auction' })
  @ApiResponse({
    status: 201,
    description: 'Auction successfully created.',
    type: CreateAuctionResultDto,
  })
  create(
    @Body() createAuctionDto: CreateAuctionDto,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ): Promise<CreateAuctionResultDto> {
    return this.auctionService.create(createAuctionDto, jwtPayload);
  }

  @Post(':id/auction-item')
  @ApiOperation({ summary: 'Create auction item' })
  @ApiResponse({
    status: 201,
    description: 'Auction item successfully created.',
    type: CreateAuctionItemResultDto,
  })
  createAuctionItem(
    @Param('id') auctionId: string,
    @Body() createAuctionItemDto: CreateAuctionItemDto,
    @GetJwtPayload() jwtPayLoad: JwtPayloadDto,
  ): Promise<CreateAuctionItemResultDto> {
    return this.auctionService.createAuctionItem(
      auctionId,
      createAuctionItemDto,
      jwtPayLoad,
    );
  }

  @Get()
  @ApiOperation({ summary: 'NOT_IMPLEMENTED Get all auctions' })
  @ApiResponse({ status: 200, description: 'Return all auctions.' })
  findAll() {
    return this.auctionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get auction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return auction by ID. served with enlisted auction items',
    type: ReadAuctionDto,
  })
  @ApiResponse({ status: 404, description: 'Auction not found.' })
  findOne(
    @Param('id') id: string,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ): Promise<ReadAuctionDto> {
    return this.auctionService.findOne(id, jwtPayload);
  }

  @ApiOperation({ summary: 'Get auction item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return auction item by ID. served with enlisted user',
    type: ReadAuctionItemDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Auction item not found.' })
  @Get(':id')
  findAuctionItemById(@Param('id') auctionItemId: string) {
    return this.auctionService.findAuctionItemById(auctionItemId);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update auction. 경매 상세정보 수정 뿐만 아니라 경매의 상태(시작, 종료 등) 수정에도 사용할 수 있음',
  })
  @ApiResponse({ status: 200, description: 'Auction successfully updated.' })
  @ApiResponse({ status: 404, description: 'Auction not found.' })
  update(
    @Param('id') id: string,
    @Body() updateAuctionDto: UpdateAuctionDto,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ) {
    return this.auctionService.update(id, updateAuctionDto, jwtPayload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'NOT_IMPLEMENTED Delete auction' })
  @ApiResponse({ status: 200, description: 'Auction successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Auction not found.' })
  remove(@Param('id') id: string) {
    return this.auctionService.remove(id);
  }
}
