import { Injectable } from '@nestjs/common';
import { CreateWriteDto } from './dto/create-write.dto';
import { UpdateWriteDto } from './dto/update-write.dto';

@Injectable()
export class WriteService {
  create(createWriteDto: CreateWriteDto) {
    return 'This action adds a new write';
  }

  findAll() {
    return `This action returns all write`;
  }

  findOne(id: number) {
    return `This action returns a #${id} write`;
  }

  update(id: number, updateWriteDto: UpdateWriteDto) {
    return `This action updates a #${id} write`;
  }

  remove(id: number) {
    return `This action removes a #${id} write`;
  }
}
