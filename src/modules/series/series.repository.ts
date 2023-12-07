import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { Series } from '@prisma/client';
import { UpdateSeriesDto } from './dto/update-series.dto';

@Injectable()
export class SeriesRepository {
  constructor(private prisma: PrismaService) {}

  async createSeries(createSeriesDto: CreateSeriesDto): Promise<Series> {
    try {
      const { name } = createSeriesDto;
      const series = await this.prisma.series.upsert({
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
      return series;
    } catch (error) {
      console.error(error);
    }
  }

  async findAll() {
    try {
      const series = await this.prisma.series.findMany({});
      return series;
    } catch (error) {
      console.error(error);
    }
  }

  async findOne(id: number) {
    try {
      const series = await this.prisma.series.findUnique({
        where: {
          id,
        },
        include: {
          writes: true,
        },
      });
      return series;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: '중복된 이름의 폴더입니다.',
          },
          HttpStatus.NOT_FOUND,
        );
      }
    }
  }

  async findOneWithWrite(id: number) {
    try {
      const series = await this.prisma.series.findUnique({
        where: {
          id,
        },
        include: {
          writes: true,
        },
      });
      return series;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: '중복된 이름의 폴더입니다.',
          },
          HttpStatus.NOT_FOUND,
        );
      }
    }
  }

  async update(id: number, updateSeriesDto: UpdateSeriesDto) {
    const { name } = updateSeriesDto;
    try {
      const series = await this.prisma.series.update({
        data: {
          name,
        },
        where: {
          id,
        },
      });
      return series;
    } catch (error) {
      console.error(error);

      if (error.code === 'P2002') {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: '중복된 이름의 폴더입니다.',
          },
          HttpStatus.NOT_FOUND,
        );
      }
    }
  }

  async delete(id: number) {
    try {
      const series = await this.prisma.series.delete({
        where: {
          id,
        },
      });
      return series;
    } catch (error) {
      console.error(error);

      if (error.code === 'P2002') {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: '중복된 이름의 폴더입니다.',
          },
          HttpStatus.NOT_FOUND,
        );
      }
    }
  }
}
