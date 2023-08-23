import { PartialType } from '@nestjs/swagger';
import { CreateWriteDto } from './create-write.dto';

export class UpdateWriteDto extends PartialType(CreateWriteDto) {}
