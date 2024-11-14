import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
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
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
import {
  AuctionIds,
  AuctionIdsWithJwtPayload,
} from '~/src/common/dto/auctionIdsWithJwtPayload';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileService } from '~/src/domain/file/file.service';
import { imageVideoFileFilter } from '~/src/common/filters/file-filter/file.filters';
import { CreateAuctionServiceDto } from '~/src/domain/auction/dto/service/create.auction.service.dto';
import { EnterPrivateAuctionDto } from '~/src/domain/auction/dto/auction/enter.private.auction.dto';
import { EnterPrivateAuctionServiceDto } from '~/src/domain/auction/dto/auction/enter.private.auction.service.dto';

@ApiTags('Auction apis')
@UseGuards(JwtAuthGuard)
@Controller('auction')
export class AuctionController {
  constructor(
    private readonly auctionService: AuctionService,
    private readonly fileService: FileService,
  ) {}

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

  @ApiOperation({
    summary: 'Create auction item',
    description:
      "'Content-Type': 'multipart/form-data' client 측에서 설정해야 함. 최대 사진 수는 5개. 최대 총 파일 크기는 5mb",
  })
  @ApiResponse({
    status: 201,
    description: 'Auction item successfully created.',
    type: CreateAuctionItemResultDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'All fields must be filled. At least one image must be uploaded.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        startPrice: { type: 'number' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          minItems: 1,
          maxItems: 5,
        },
      },
      required: ['title', 'description', 'startPrice', 'images'],
    },
  })
  @Post(':id/item')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      fileFilter: imageVideoFileFilter,
    }),
  )
  async createAuctionItem(
    @Param('id', new ParseUUIDPipe()) auctionId: string,
    @Body() createAuctionItemDto: CreateAuctionItemDto,
    @UploadedFiles() images: Express.Multer.File[],
    @GetJwtPayload() jwtPayLoad: JwtPayloadDto,
  ): Promise<CreateAuctionItemResultDto> {
    if (!images || images.length === 0)
      throw new BadRequestException('images is required');
    const imageUploadPromises = images.map((image) =>
      this.fileService.uploadFile(image),
    );
    const imageUrls = await Promise.all(imageUploadPromises);
    const createAuctionServiceDto = new CreateAuctionServiceDto(
      new AuctionIds(auctionId, null),
      jwtPayLoad,
      createAuctionItemDto,
      imageUrls,
    );
    return this.auctionService.createAuctionItem(createAuctionServiceDto);
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
    @Query('userId', new ParseUUIDPipe({ optional: true })) userId?: string,
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
    @Query('buyerId', new ParseUUIDPipe()) buyerId: string,
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
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ): Promise<ReadAuctionDto> {
    return this.auctionService.getAuctionDetail(id, jwtPayload);
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
    @Param('id', new ParseUUIDPipe()) auctionId: string,
    @Param('itemId', new ParseUUIDPipe()) auctionItemId: string,
  ) {
    return this.auctionService.getAuctionItem(auctionId, auctionItemId);
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        startPrice: { type: 'number' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          minItems: 1,
          maxItems: 5,
        },
      },
      required: ['title', 'description', 'startPrice', 'images'],
    },
  })
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      fileFilter: imageVideoFileFilter,
    }),
  )
  @Patch(':auctionId/item/:itemId')
  updateAuctionItem(
    @Param('auctionId', new ParseUUIDPipe()) auctionId: string,
    @Param('itemId', new ParseUUIDPipe()) auctionItemId: string,
    @Body() updateAuctionItemDto: UpdateAuctionItemDto,
    @UploadedFiles() images: Express.Multer.File[],
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ) {
    return this.auctionService.updateAuctionItem(
      auctionId,
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
    @Param('id', new ParseUUIDPipe()) id: string,
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
    @Param('id', new ParseUUIDPipe()) auctionId: string,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ) {
    return this.auctionService.remove(auctionId, jwtPayload);
  }

  @ApiOperation({ summary: 'Delete auction item' })
  @ApiResponse({
    status: 200,
    description: 'Auction item successfully deleted.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Occurs when auction item owner id and client id is different.',
  })
  @ApiResponse({ status: 404, description: 'Auction not found.' })
  @Delete(':auctionId/item/:itemId')
  removeItem(
    @Param('auctionId', new ParseUUIDPipe()) auctionId: string,
    @Param('itemId', new ParseUUIDPipe()) auctionItemId: string,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ) {
    const removeItemServiceDto = new AuctionIdsWithJwtPayload(
      new AuctionIds(auctionId, auctionItemId),
      jwtPayload,
    );
    return this.auctionService.removeItem(removeItemServiceDto);
  }

  @Post(':auctionId/private/enter')
  enterPrivateAuction(
    @Param('auctionId', new ParseUUIDPipe()) auctionId: string,
    @Body() enterPrivateAuctionDto: EnterPrivateAuctionDto,
    @GetJwtPayload() jwtPayload: JwtPayloadDto,
  ) {
    const enterPrivateAuctionServiceDto = new EnterPrivateAuctionServiceDto(
      auctionId,
      jwtPayload,
      enterPrivateAuctionDto,
    );
    return this.auctionService.enterPrivate(enterPrivateAuctionServiceDto);
  }
}
