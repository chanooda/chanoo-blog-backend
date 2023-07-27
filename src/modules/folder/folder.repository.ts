import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { FolderCreateDto } from './dto/folder-create.dto';
import { Folder } from '@prisma/client';
import { GetFolderDataDto } from './dto/folders-response.dto';
import { FolderUpdateDto } from './dto/folder-upadate.dto';

@Injectable()
export class FolderRepository {
  constructor(private prisma: PrismaService) {}

  async createFolder(createFolderDto: FolderCreateDto): Promise<Folder> {
    const folder = await this.prisma.folder.create({
      data: createFolderDto,
    });
    return folder;
  }

  async getTopFolders(): Promise<GetFolderDataDto[]> {
    const folders = await this.prisma.folder.findMany({
      where: {
        parentId: null,
      },
      include: {
        child: true,
        parent: true,
      },
    });

    return folders;
  }

  async getFolderById(id: number): Promise<GetFolderDataDto> {
    const folders = await this.prisma.folder.findUnique({
      where: { id: id },
      include: {
        child: true,
        parent: true,
      },
    });

    return folders;
  }

  async patchFolder(id: number, FolderUpdateDto: FolderUpdateDto) {
    const { child, parentId, ...rest } = FolderUpdateDto;

    const folder = await this.prisma.folder.update({
      where: {
        id,
      },
      data: {
        ...rest,
        parentId,
        child: {
          connect: child.map((id) => ({ id })),
        },
      },
    });

    return folder;
  }

  async deleteFolder(id: number) {
    try {
      await this.prisma.folder.delete({
        where: {
          id,
        },
      });
      return;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: '해당 id의 유저가 존재하지 않습니다.',
        },
        HttpStatus.NOT_FOUND,
        { cause: error },
      );
    }
  }
}
