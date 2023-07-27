import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class FolderCreateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '폴더이름' })
  name: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: '상위폴더 ID', example: null })
  parentId?: number;
}
