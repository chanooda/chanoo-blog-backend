import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FolderModule } from '../folder/folder.module';
import { LoggerMiddleware } from 'src/middleware/logger.middleware';
import { SeriesModule } from '../series/series.module';
import { TagModule } from '../tag/tag.module';
import { WriteModule } from '../write/write.module';

@Module({
  imports: [FolderModule, SeriesModule, TagModule, WriteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
