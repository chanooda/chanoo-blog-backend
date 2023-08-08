import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FolderCreateDto } from './dto/folder-create.dto';
import { FolderRepository } from './folder.repository';
import { CommonResponse } from 'src/common/dto/response.dto';
import { GetFolderDataDto } from './dto/folders-response.dto';
import { AwsRepository } from '../aws/aws.repository';
import { ImageRepository } from '../image/Image.repository';
import { FolderImageRepository } from '../folderImage/folderImage.repository';
import { FolderUpdateDto } from './dto/folder-update.dto';

@Injectable()
export class FolderService {
  constructor(
    private folderRepository: FolderRepository,
    private awsRepository: AwsRepository,
    private imageRepository: ImageRepository,
    private folderImageRepository: FolderImageRepository,
  ) {}

  async getTopFolders(): Promise<CommonResponse<GetFolderDataDto[]>> {
    const folders = await this.folderRepository.getTopFolders();
    return {
      status: HttpStatus.OK,
      data: folders,
    };
  }

  async getFolderById(id: number): Promise<CommonResponse<GetFolderDataDto>> {
    const folder = await this.folderRepository.getFolderById(id);
    return {
      status: HttpStatus.OK,
      data: folder,
    };
  }

  async createFolder(createFolderDto: FolderCreateDto) {
    return await this.folderRepository.createFolder(createFolderDto);
  }

  async patchFolder(id: number, folderUpdateDto: FolderUpdateDto) {
    return await this.folderRepository.patchFolder(id, folderUpdateDto);
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} folder`;
  // }

  // update(id: number, updateFolderDto: UpdateFolderDto) {
  //   return `This action updates a #${id} folder`;
  // }

  deleteFolder(id: number) {
    return this.folderRepository.deleteFolder(id);
  }

  async uploadImageFolder(
    id: number,
    file: Express.Multer.File,
  ): Promise<CommonResponse> {
    const folder = await this.folderRepository.getFolderById(id);
    const filteredFile = file;
    const checkFileNameReg = /\.[^/.]+$/;
    const checkFileNumberReg = /(\(\d+\))$/;
    const extension = filteredFile.originalname.match(checkFileNameReg);
    const fileNumber = filteredFile.originalname.match(checkFileNumberReg)?.[0];
    const fileName = filteredFile.originalname
      .replace(checkFileNameReg, '')
      .trim()
      .replace(fileNumber, '');
    const duplicateImageCount =
      await this.folderImageRepository.getFolderImageById(id, fileName);

    if (duplicateImageCount > 0) {
      console.log(fileName.match(checkFileNumberReg));
      console.log(fileNumber);
      console.log(fileNumber);

      filteredFile.originalname = `${fileName.replace(
        fileNumber,
        '',
      )} (${duplicateImageCount})${extension}`;
    }

    const image = await this.awsRepository.imageUpload(folder.name, file);
    await this.folderImageRepository.createFolderImage(id, image);

    return { status: 200 };
  }

  async uploadImagesFolder(
    id: number,
    fileList: Array<Express.Multer.File>,
  ): Promise<CommonResponse> {
    try {
      const folder = await this.folderRepository.getFolderById(id);
      const folderImages = await this.folderImageRepository.getFolderImagesById(
        id,
        fileList,
      );
      if (folderImages.some((folderImage) => folderImage)) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            errorCode: 'unique',
          },
          HttpStatus.BAD_REQUEST,
          { cause: new Error() },
        );
      }
      const imageList = await this.awsRepository.imagesUpload(
        folder.name,
        fileList,
      );

      await this.folderImageRepository.createFolderImages(id, imageList);

      return { status: 200 };
    } catch (error) {
      throw new Error(error);
    }
  }

  async deleteFolderImage(id: number): Promise<CommonResponse> {
    const folderImage = await this.folderImageRepository.deleteFolderImage(id);

    const {
      originalname,
      folder: { name },
    } = folderImage;
    console.log(folderImage);
    const awsResponse = await this.awsRepository.imageDelete(
      name,
      originalname,
    );
    return { status: 200 };
  }
}
