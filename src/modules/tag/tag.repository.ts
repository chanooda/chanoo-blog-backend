import { Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagRepository {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto) {
    try {
      const { name } = createTagDto;
      const tag = await this.prisma.tag.upsert({
        create: {
          name,
        },
        update: {
          name,
        },
        where: {
          name,
        },
      });
      return tag;
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  async update(id: number, updateTagDto: UpdateTagDto) {
    try {
      const { name } = updateTagDto;
      const tag = await this.prisma.tag.update({
        data: {
          name,
        },
        where: {
          id,
        },
      });
      return tag;
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  async delete(id: number) {
    try {
      await this.prisma.tag.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  async findAll() {
    try {
      const tag = await this.prisma.tag.findMany();
      return tag;
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
}
