import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuctionItemDto {
  @ApiProperty({
    description: '경매 아이템의 제목',
    maxLength: 255,
    example: 'Antique Vase',
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiProperty({
    description: '경매 아이템의 설명',
    example: 'A beautiful ancient vase from the Ming dynasty',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: '경매 시작 가격',
    example: 1000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  startPrice: number;
}
