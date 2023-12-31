import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWriteDto {
  @ApiProperty({
    description: '글 제목',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '글 본문',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @ApiProperty({
    description: '글 게시 여부',
  })
  @IsBoolean()
  @IsNotEmpty()
  isPublish: boolean;

  @ApiProperty({
    description: '글 메인 이미지 url',
    required: false,
  })
  @IsString()
  @IsOptional()
  imgUrl?: string;

  @ApiProperty({
    description: '새 시리즈 이름',
    required: false,
  })
  @IsString()
  @IsOptional()
  seriesName?: string;

  @ApiProperty({
    description: '새로운 태그',
    required: false,
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  tagNames?: string[];
}
