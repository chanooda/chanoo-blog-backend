import { Injectable } from '@nestjs/common';
import { CreateWriteDto } from './dto/create-write.dto';
import { UpdateWriteDto } from './dto/update-write.dto';
import { WriteRepository } from './write.repository';
import { WriteResDto } from './dto/response-write.dto';
import { WriteFindAllDto } from './dto/find-write.dto';

@Injectable()
export class WriteService {
  constructor(private writeRepository: WriteRepository) {}

  async create(createWriteDto: CreateWriteDto): Promise<WriteResDto> {
    try {
      const write = await this.writeRepository.create(createWriteDto);
      return write;
    } catch (error) {
      console.log(error);
    }
  }

  async findAll(writeFindAllDto: WriteFindAllDto) {
    return await this.writeRepository.findAll(writeFindAllDto);
  }

  async findOne(id: number) {
    return await this.writeRepository.findOne(id);
  }

  async update(id: number, updateWriteDto: UpdateWriteDto) {
    return await this.writeRepository.update(id, updateWriteDto);
  }

  async remove(id: number) {
    return await this.writeRepository.delete(id);
  }
}
