import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWriteDto } from './dto/create-write.dto';
import { UpdateWriteDto } from './dto/update-write.dto';
import { WriteResDto } from './dto/response-write.dto';
import { WriteFindAllDto } from './dto/find-write.dto';

@Injectable()
export class WriteRepository {
  constructor(private prisma: PrismaService) {}

  async create(createWriteDto: CreateWriteDto): Promise<WriteResDto> {
    const { content, isPublish, title, imgUrl, seriesName, tagNames } =
      createWriteDto;

    const parsedTagNames: string[] = JSON.parse(String(tagNames) || '[]');

    try {
      const write = await this.prisma.$transaction(async (tx) => {
        return await tx.write.create({
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
      });

      return write;
    } catch (error) {
      console.log(error);
    }
  }

  async update(id: number, updateWriteDto: UpdateWriteDto) {
    const { content, isPublish, title, imgUrl, seriesName, tagNames } =
      updateWriteDto;

    const parsedTagNames: string[] = JSON.parse(String(tagNames) || '[]');

    console.log(updateWriteDto);

    try {
      await this.prisma.$transaction(async (tx) => {
        const deletedWritesTags = [];
        const createtWroteTags = [];

        const writesTags = await tx.writesTag.findMany({
          where: {
            writeId: id,
          },
          include: {
            tag: true,
          },
        });
        console.log(writesTags);

        writesTags?.forEach((writeTag) => {
          const index = parsedTagNames.findIndex(
            (tagName) => tagName === writeTag.tag.name,
          );
          if (index === -1) {
            deletedWritesTags.push(writeTag);
          } else {
            parsedTagNames.splice(index, 1);
          }
        });

        console.log('deletedWriteTagId', deletedWritesTags);

        const write = await tx.write.update({
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
            tags: {
              delete: deletedWritesTags?.map((deletedWritesTag) => ({
                id: deletedWritesTag.id,
              })),
              create: parsedTagNames?.map((name) => ({
                tag: {
                  connectOrCreate: {
                    create: {
                      name: name,
                    },
                    where: {
                      name: name,
                    },
                  },
                },
              })),
            },
          },
          where: {
            id,
          },
        });

        return write;
      });
    } catch (error) {
      console.log(error);
    }
  }

  async findAll(writeFindAllDto: WriteFindAllDto) {
    const { limit, page, search, seriesId, tagId } = writeFindAllDto;
    try {
      const prisma = this.prisma.$extends({
        result: {
          write: {
            content: {
              needs: { content: true },
              compute(write) {
                return write.content.slice(0, 600);
              },
            },
          },
        },
      });
      const writes = await prisma.write.findMany({
        skip: page * 10 || 0,
        take: limit || 10,
        where: {
          ...(search && {
            title: {
              contains: search || '',
            },
          }),
          ...(tagId && {
            tags: {
              some: {
                tagId: tagId,
              },
            },
          }),
          ...(seriesId && { seriesId }),
        },
        include: {
          series: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

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
        include: {
          series: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
      if (!write) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: '해당 id의 유저가 존재하지 않습니다.',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return write;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        {
          status: HttpStatus.EXPECTATION_FAILED,
          error: error,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async delete(id: number) {
    try {
      await this.prisma.write.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.EXPECTATION_FAILED,
          error: error,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
