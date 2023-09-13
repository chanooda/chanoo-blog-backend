import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class Pagination {
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    name: 'page',
    description: '페이지',
    required: false,
  })
  page?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    name: 'limit',
    description: '요소 개수',
    required: false,
  })
  limit?: number;
}
