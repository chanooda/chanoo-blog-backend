import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CommonResponse, IdReq, IdRes } from 'src/common/dto/response.dto';
import { CreateWriteDto } from './dto/create-write.dto';
import { WriteFindAllDto } from './dto/find-write.dto';
import {
  GetWriteDto,
  GetWritesDto,
  WriteFullResDto,
} from './dto/response-write.dto';
import { UpdateWriteDto } from './dto/update-write.dto';
import { WriteService } from './write.service';

@ApiTags('write')
@Controller('write')
export class WriteController {
  constructor(private readonly writeService: WriteService) {}

  @ApiOperation({ summary: '글 생성하기' })
  @ApiConsumes('multipart/form-data')
  @Post()
  @UseInterceptors(NoFilesInterceptor())
  async create(
    @Body() createWriteDto: CreateWriteDto,
  ): Promise<CommonResponse<IdRes>> {
    const id = await this.writeService.create(createWriteDto);
    return {
      status: HttpStatus.OK,
      data: id,
    };
  }

  @ApiOperation({ summary: '글 수정하기' })
  @ApiConsumes('multipart/form-data')
  @Patch(':id')
  @UseInterceptors(NoFilesInterceptor())
  update(
    @Param('id') id: string,
    @Body() updateWriteDto: UpdateWriteDto,
  ): Promise<IdRes> {
    return this.writeService.update(+id, updateWriteDto);
  }

  @ApiOperation({ summary: '글 모두 가져오기' })
  @ApiOkResponse({
    type: GetWritesDto,
  })
  @Get()
  async findAll(
    @Query() writeFindAllDto: WriteFindAllDto,
  ): Promise<CommonResponse<WriteFullResDto[]>> {
    const writes = await this.writeService.findAll(writeFindAllDto);
    return {
      status: HttpStatus.OK,
      data: writes,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '글 가져오기' })
  @ApiOkResponse({
    type: GetWriteDto,
  })
  async findOne(
    @Param() { id }: IdReq,
  ): Promise<CommonResponse<WriteFullResDto>> {
    try {
      const write = await this.writeService.findOne(+id);
      return {
        status: HttpStatus.OK,
        data: write,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param() { id }: IdReq) {
    try {
      await this.writeService.remove(+id);

      return {
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw error;
    }
  }
}
