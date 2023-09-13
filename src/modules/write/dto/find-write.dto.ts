import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Pagination } from 'src/common/dto/request.dto';

export class WriteFindAllDto extends Pagination {
  @IsString()
  @IsOptional()
  @ApiProperty({
    name: 'search',
    description: '검색어',
    required: false,
  })
  search?: string;
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    name: 'tagId',
    description: '태그 id',
    required: false,
  })
  tagId?: number;
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    name: 'seriesId',
    description: '시리즈 id',
    required: false,
  })
  seriesId?: number;
}
