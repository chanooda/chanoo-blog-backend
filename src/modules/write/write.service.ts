import { Injectable } from '@nestjs/common';
import { IdRes } from 'src/common/dto/response.dto';
import { CreateWriteDto } from './dto/create-write.dto';
import { WriteFindAllDto } from './dto/find-write.dto';
import { UpdateWriteDto } from './dto/update-write.dto';
import { WriteRepository } from './write.repository';

@Injectable()
export class WriteService {
  constructor(private writeRepository: WriteRepository) {}

  async create(createWriteDto: CreateWriteDto): Promise<IdRes> {
    try {
      const write = await this.writeRepository.create(createWriteDto);
      return write;
    } catch (error) {
      return error;
    }
  }

  async findAll(writeFindAllDto: WriteFindAllDto) {
    try {
      return await this.writeRepository.findAll(writeFindAllDto);
    } catch (error) {
      return error;
    }
  }

  async findOne(id: number) {
    return await this.writeRepository.findOne(id);
  }

  async update(id: number, updateWriteDto: UpdateWriteDto) {
    try {
      return await this.writeRepository.update(id, updateWriteDto);
    } catch (error) {
      return error;
    }
  }

  async remove(id: number) {
    return await this.writeRepository.delete(id);
  }
}
