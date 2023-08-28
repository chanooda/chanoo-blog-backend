import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Folder, FolderImage } from '@prisma/client';

@Injectable()
export class FolderImageRepository {
  constructor(private prisma: PrismaService) {}

  async createFolderImages(
    folderId: number,
    fileList: Array<Omit<Express.Multer.File, 'buffer'> & { url: string }>,
  ) {
    try {
      await this.prisma.folderImage.createMany({
        data: fileList?.map(({ destination, path, stream, ...file }) => ({
          ...file,
          folderId,
        })),
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async createFolderImage(
    folderId: number,
    file: Omit<Express.Multer.File, 'buffer'> & { url: string },
  ) {
    try {
      const { path, stream, destination, encoding, ...fileInfo } = file;

      await this.prisma.folderImage.create({
        data: {
          folderId,
          ...fileInfo,
        },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async getFolderImageById(folderId: number, fileName: string) {
    const folderImage = await this.prisma.folderImage.findMany({
      where: {
        AND: {
          folderId,
          originalname: {
            contains: fileName,
          },
        },
      },
    });

    console.log('folderImage');
    console.log(folderImage);
    console.log('\n');

    return folderImage.length;
  }

  async getFolderImagesById(
    folderId: number,
    fileList: Array<Omit<Express.Multer.File, 'buffer'>>,
  ) {
    const folderImages = await Promise.all(
      fileList.map((file) =>
        this.prisma.folderImage.findFirst({
          where: {
            AND: {
              folderId,
              originalname: file.originalname,
            },
          },
        }),
      ),
    );

    console.log('folderImages');
    console.log(folderImages);
    console.log('\n');

    return folderImages;
  }

  async deleteFolderImage(
    id: number,
  ): Promise<FolderImage & { folder: Folder }> {
    try {
      const folderImage = await this.prisma.folderImage.delete({
        where: {
          id,
        },
        include: {
          folder: true,
        },
      });

      return folderImage;
    } catch (error) {
      throw new Error(error);
    }
  }
}
