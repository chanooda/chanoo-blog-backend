import { Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SeriesRepository } from './series.repository';

@Module({
  controllers: [SeriesController],
  providers: [SeriesService, SeriesRepository],
  imports: [PrismaModule],
})
export class SeriesModule {}
