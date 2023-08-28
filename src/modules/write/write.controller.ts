import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { WriteService } from './write.service';
import { CreateWriteDto } from './dto/create-write.dto';
import { UpdateWriteDto } from './dto/update-write.dto';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NoFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('write')
@Controller('write')
export class WriteController {
  constructor(private readonly writeService: WriteService) {}

  @ApiOperation({ summary: '글 생성' })
  @ApiConsumes('multipart/form-data')
  @Post()
  @UseInterceptors(NoFilesInterceptor())
  create(@Body() createWriteDto: CreateWriteDto) {
    console.log(createWriteDto);
    return this.writeService.create(createWriteDto);
  }

  @Get()
  findAll() {
    return this.writeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.writeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWriteDto: UpdateWriteDto) {
    return this.writeService.update(+id, updateWriteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.writeService.remove(+id);
  }
}
