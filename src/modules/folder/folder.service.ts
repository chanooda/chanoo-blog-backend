import { HttpStatus, Injectable } from '@nestjs/common';
import { FolderCreateDto } from './dto/folder-create.dto';
import { FolderRepository } from './folder.repository';
import { CommonResponse } from 'src/common/dto/response.dto';
import { GetFolderDataDto } from './dto/folders-response.dto';
import { FolderUpdateDto } from './dto/folder-upadate.dto';

@Injectable()
export class FolderService {
  constructor(private folderRepository: FolderRepository) {}

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
}
