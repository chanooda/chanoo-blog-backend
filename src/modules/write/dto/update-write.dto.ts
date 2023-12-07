import { ApiProperty, PartialType, getSchemaPath } from '@nestjs/swagger';
import { CreateWriteDto } from './create-write.dto';
import { CreateTagDto } from 'src/modules/tag/dto/create-tag.dto';

export class UpdateWritesTags extends CreateTagDto {
  @ApiProperty({ description: '태그+글 id', type: 'number' })
  id: number;
}
export class UpdateWriteDto extends PartialType(CreateWriteDto) {
  @ApiProperty({
    description: '태그+글',
    default: [],
    type: UpdateWritesTags,
    items: {
      type: getSchemaPath(UpdateWritesTags),
    },
  })
  writesTags: UpdateWritesTags[];
}
