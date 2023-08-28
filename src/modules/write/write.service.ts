import { Injectable } from '@nestjs/common';
import { CreateWriteDto } from './dto/create-write.dto';
import { UpdateWriteDto } from './dto/update-write.dto';
import { WriteRepository } from './write.repository';
import { PrismaService } from '../prisma/prisma.service';
import { SeriesRepository } from '../series/series.repository';
import { TagRepository } from '../tag/tag.repository';
import { WriteTagRepository } from './writeTag.repository';

@Injectable()
export class WriteService {
  constructor(
    private prisma: PrismaService,
    private writeRepository: WriteRepository,
    private seriesRepository: SeriesRepository,
    private tagRepository: TagRepository,
    private writeTagRepository: WriteTagRepository,
  ) {}

  async create(createWriteDto: CreateWriteDto) {
    try {
      const write = await this.writeRepository.create(createWriteDto);
    } catch (error) {
      console.log(error);
    }
  }

  async findAll() {
    return await this.writeRepository.findAll();
  }

  async findOne(id: number) {
    return await this.writeRepository.findOne(id);
  }

  update(id: number, updateWriteDto: UpdateWriteDto) {
    return `This action updates a #${id} write`;
  }

  remove(id: number) {
    return `This action removes a #${id} write`;
  }
}
