import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UploadedFiles,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FolderService } from './folder.service';
import { FolderCreateDto } from './dto/folder-create.dto';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CommonResponse } from 'src/common/dto/response.dto';
import {
  GetFolderDataDto,
  GetFolderDto,
  GetFoldersDto,
} from './dto/folders-response.dto';
import { FolderUpdateDto } from './dto/folder-update.dto';
import { ApiFile, ApiFiles } from 'src/common/decorater/file.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('folders')
@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @ApiOperation({ summary: '최상단 폴더 가져오기 api' })
  @ApiOkResponse({
    type: GetFoldersDto,
  })
  @Get()
  getTopFolders(): Promise<CommonResponse<GetFolderDataDto[]>> {
    return this.folderService.getTopFolders();
  }

  @ApiOperation({ summary: '단일 폴더 가져오기 api' })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
  })
  @ApiOkResponse({
    type: GetFolderDto,
  })
  @Get(':id')
  getFolderById(
    @Param('id') id: string,
  ): Promise<CommonResponse<GetFolderDataDto>> {
    return this.folderService.getFolderById(+id);
  }

  @ApiOperation({ summary: '폴더 생성하기 api' })
  @Post()
  createFolder(@Body() createFolderDto: FolderCreateDto) {
    return this.folderService.createFolder(createFolderDto);
  }

  @ApiOperation({ summary: '폴더 수정하기 api' })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
  })
  @Patch(':id')
  pathFolder(
    @Param('id') id: string,
    @Body() folderUpdateDto: FolderUpdateDto,
  ) {
    return this.folderService.patchFolder(+id, folderUpdateDto);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.folderService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto) {
  //   return this.folderService.update(+id, updateFolderDto);
  // }

  @ApiOperation({ summary: '폴더 삭제하기 api' })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
  })
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.folderService.deleteFolder(+id);
  }

  @ApiOperation({ summary: '폴더에 이미지 한번에 여러개 추가하기 api' })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
  })
  @Post('/:id/images')
  @ApiFiles('images')
  async uploadImagesFolder(
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Param('id') id: string,
  ) {
    return this.folderService.uploadImagesFolder(Number(id), images);
  }

  @Post('/:id/image')
  @ApiFile('image')
  @ApiOperation({ summary: '폴더에 이미지 한개 추가하기 api' })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
  })
  async uploadImageFolder(
    @UploadedFile() image: Express.Multer.File,
    @Param('id') id: string,
  ) {
    console.log(image);
    return this.folderService.uploadImageFolder(Number(id), image);
  }
}
