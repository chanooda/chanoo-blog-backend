import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TagRepository } from './tag.repository';

@Module({
  controllers: [TagController],
  providers: [TagService, TagRepository],
  imports: [PrismaModule],
})
export class TagModule {}
