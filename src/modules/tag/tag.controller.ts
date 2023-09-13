import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  GetTagWithWriteResDto,
  GetTagsResDto,
  TagResDto,
} from './dto/response-tag.dto';
import { CommonResponse } from 'src/common/dto/response.dto';

@ApiTags('tag')
@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @ApiOperation({ summary: '태그 생성' })
  @ApiOkResponse({
    type: GetTagsResDto,
  })
  @Post()
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagService.create(createTagDto);
  }

  @ApiOperation({ summary: '태그 모두 가져오기' })
  @ApiOkResponse({
    type: GetTagsResDto,
  })
  @Get()
  async findAll(): Promise<CommonResponse<TagResDto[]>> {
    const tags = await this.tagService.findAll();
    return {
      data: tags,
      status: HttpStatus.OK,
    };
  }

  @ApiOperation({ summary: '태그별 글 가져오기' })
  @ApiOkResponse({
    type: GetTagWithWriteResDto,
  })
  @Get(':id')
  findOneWithWrite(@Param('id') id: string) {
    return this.tagService.findOneWithWrite(+id);
  }

  @ApiOperation({ summary: '태그 수정하기' })
  @ApiOkResponse({
    type: GetTagsResDto,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagService.update(+id, updateTagDto);
  }

  @ApiOperation({ summary: '태그 지우기' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tagService.remove(+id);
  }
}
