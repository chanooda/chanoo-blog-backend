import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagRepository } from './tag.repository';
import { Tag } from '@prisma/client';
import { CommonResponse } from 'src/common/dto/response.dto';

@Injectable()
export class TagService {
  constructor(private tagRepository: TagRepository) {}

  async create(createTagDto: CreateTagDto): Promise<CommonResponse<Tag>> {
    const tag = await this.tagRepository.create(createTagDto);
    return {
      status: HttpStatus.OK,
      data: tag,
    };
  }

  async findAll(): Promise<CommonResponse<Tag[]>> {
    const tags = await this.tagRepository.findAll();
    return {
      status: HttpStatus.OK,
      data: tags,
    };
  }

  async update(
    id: number,
    updateTagDto: UpdateTagDto,
  ): Promise<CommonResponse<Tag>> {
    const tag = await this.tagRepository.update(id, updateTagDto);
    return {
      status: HttpStatus.OK,
      data: tag,
    };
  }

  async remove(id: number): Promise<CommonResponse<undefined>> {
    await this.tagRepository.delete(id);
    return { status: HttpStatus.OK };
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} tag`;
  // }
}
