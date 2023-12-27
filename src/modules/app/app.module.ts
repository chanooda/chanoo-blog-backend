import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { LoggerMiddleware } from 'src/middleware/logger.middleware';
import { AuthModule } from '../auth/auth.module';
import { FolderModule } from '../folder/folder.module';
import { SeriesModule } from '../series/series.module';
import { TagModule } from '../tag/tag.module';
import { WriteModule } from '../write/write.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
      ignoreEnvFile: process.env.NODE_ENV !== 'dev',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod'),
        MASTER_ID: Joi.string().required(),
        MASTER_PW: Joi.string().required(),
        JWT_SECRET_KEY: Joi.string().required(),
      }),
    }),
    FolderModule,
    SeriesModule,
    TagModule,
    WriteModule,
    AuthModule.forRoot({
      privateKey: process.env.JWT_SECRET_KEY,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
