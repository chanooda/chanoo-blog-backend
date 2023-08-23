import { Module } from '@nestjs/common';
import { WriteService } from './write.service';
import { WriteController } from './write.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WriteController],
  providers: [WriteService],
  imports: [PrismaService],
})
export class WriteModule {}
