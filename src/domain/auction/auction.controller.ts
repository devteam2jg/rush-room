import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReadAuctionItemDetailDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.detail.dto';
import { PaginationRequest } from '~/src/common/pagination/pagination.request';
import { GetPagination } from '~/src/common/pagination/get.pagination.decorator';
import {
  ApiPaginationRequest,
  ApiPaginationResponse,
} from '~/src/common/pagination/pagination.swagger';
import { PaginationResponse } from '~/src/common/pagination/pagination.response';
import { ReadAuctionItemDto } from '~/src/domain/auction/dto/auction-item/read.auction.item.dto';
import { UpdateAuctionItemDto } from '~/src/domain/auction/dto/update.auction.item.dto';

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
  @ApiOperation({ summary: 'Get paginated auctions' })
  @ApiResponse({ status: 200, description: 'Return paginated auctions.' })
  @ApiPaginationRequest()
  @ApiPaginationResponse(ReadAuctionDto)
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description:
      '값을 주지 않으면 전체 경매 목록, userId 값을 주면 해당 유저의 경매 목록',
  })
  findPaginatedAuctions(
    @GetPagination() pagination: PaginationRequest,
    @Query('userId') userId?: string,
  ): Promise<PaginationResponse<ReadAuctionDto>> {
    return this.auctionService.getPaginatedAuctions(pagination, userId);
  }

  @Get('/item')
  @ApiOperation({ summary: 'Get paginated auction items by buyerId' })
  @ApiResponse({ status: 200, description: 'Return paginated auction items.' })
  @ApiPaginationRequest()
  @ApiPaginationResponse(ReadAuctionItemDto)
  @ApiQuery({
    name: 'buyerId',
    required: true,
    type: String,
    description: 'buyerId가 구매한 물품 목록',
  })
  findPaginatedAuctionItems(
    @GetPagination() pagination: PaginationRequest,
    @Query('buyerId') buyerId: string,
  ): Promise<PaginationResponse<ReadAuctionItemDto>> {
    return this.auctionService.getPaginatedAuctionItems(pagination, buyerId);
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
  @Get(':id/item/:itemId')
  findAuctionItemById(
    @Param('id') auctionId: string,
    @Param('itemId') auctionItemId: string,
  ) {
    return this.auctionService.findAuctionItemById(auctionId, auctionItemId);
  }

  @ApiOperation({ summary: 'Update auction item' })
  @ApiResponse({
    status: 200,
    description: 'Auction item successfully updated.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Occurs when auction item owner id and client id is different.',
  })
  @ApiResponse({ status: 404, description: 'Auction item not found.' })
  @Patch('item/:itemId')
  updateAuctionItem(
    @Param('itemId') auctionItemId: string,
    @Body() updateAuctionItemDto: UpdateAuctionItemDto,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ) {
    return this.auctionService.updateAuctionItem(
      auctionItemId,
      updateAuctionItemDto,
      jwtPayload,
    );
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

  @ApiOperation({ summary: 'Delete auction' })
  @ApiResponse({ status: 200, description: 'Auction successfully deleted.' })
  @ApiResponse({
    status: 403,
    description: 'Occurs when auction owner id and client id is different.',
  })
  @ApiResponse({ status: 404, description: 'Auction not found.' })
  @Delete(':id')
  remove(
    @Param('id') auctionId: string,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ) {
    return this.auctionService.remove(auctionId, jwtPayload);
  }
}
