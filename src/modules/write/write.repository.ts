import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWriteDto } from './dto/create-write.dto';

@Injectable()
export class WriteRepository {
  constructor(private prisma: PrismaService) {}

  async create(createWriteDto: CreateWriteDto) {
    const { content, isPublish, title, imgUrl, seriesName, tagNames } =
      createWriteDto;

    const parsedTagNames: string[] = JSON.parse(String(tagNames) || '[]');

    try {
      await this.prisma.$transaction(async (tx) => {
        if (seriesName) {
          const series = await tx.series.upsert({
            create: {
              name: seriesName,
            },
            update: {
              name: seriesName,
            },
            where: {
              name: seriesName,
            },
          });
        }

        const write = await tx.write.create({
          data: {
            isPublish: Boolean(isPublish),
            title,
            content,
            ...(imgUrl && { imgUrl }),
            ...(seriesName && {
              series: {
                connectOrCreate: {
                  create: {
                    name: seriesName,
                  },
                  where: {
                    name: seriesName,
                  },
                },
              },
            }),
            ...(parsedTagNames &&
              parsedTagNames.length > 0 && {
                tags: {
                  create: parsedTagNames?.map((tagName) => ({
                    tag: {
                      connectOrCreate: {
                        create: {
                          name: tagName,
                        },
                        where: {
                          name: tagName,
                        },
                      },
                    },
                  })),
                },
              }),
          },
        });

        return write;
      });
    } catch (error) {
      console.log(error);
    }
  }

  async findAll() {
    try {
      const writes = await this.prisma.write.findMany();

      return writes;
    } catch (error) {
      console.error(error);
    }
  }

  async findOne(id: number) {
    try {
      const write = await this.prisma.write.findUnique({
        where: {
          id,
        },
      });
      return write;
    } catch (error) {
      console.error(error);
    }
  }
}
