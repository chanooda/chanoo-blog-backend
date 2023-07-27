import { Module } from '@nestjs/common';
import { FolderService } from './folder.service';
import { FolderController } from './folder.controller';
import { FolderRepository } from './folder.repository';
import { PrismaModule } from 'src/modules/prisma/prisma.module';

@Module({
  controllers: [FolderController],
  providers: [FolderService, FolderRepository],
  imports: [PrismaModule],
})
export class FolderModule {}
