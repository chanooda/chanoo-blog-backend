import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class Pagination {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    name: 'page',
    description: '페이지',
    required: false,
  })
  page?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    name: 'limit',
    description: '요소 개수',
    required: false,
  })
  limit?: number;
}
