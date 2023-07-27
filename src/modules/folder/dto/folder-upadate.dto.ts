import { FolderCreateDto } from './folder-create.dto';
import { ApiProperty } from '@nestjs/swagger';

export class FolderUpdateDto extends FolderCreateDto {
  @ApiProperty({
    description: '하위 폴더 ID ',
    isArray: true,
    type: 'number',
    default: [],
  })
  child?: number[];

  @ApiProperty({ description: '상위 폴더 ID', type: 'number' })
  parentId?: number;
}
