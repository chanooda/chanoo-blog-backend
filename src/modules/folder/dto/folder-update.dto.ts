import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FolderUpdateDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '폴더이름' })
  name?: string;

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    description: '하위 폴더 ID ',
    isArray: true,
    type: 'number',
    default: [],
  })
  child?: number[];

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: '상위 폴더 ID', type: 'number' })
  parentId?: number;
}
