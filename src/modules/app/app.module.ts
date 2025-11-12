import {
	type MiddlewareConsumer,
	Module,
	type NestModule,
} from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import * as Joi from "joi"
import { LoggerMiddleware } from "src/middleware/logger.middleware"
import { AuthModule } from "../auth/auth.module"
import { FolderModule } from "../folder/folder.module"
import { SeriesModule } from "../series/series.module"
import { TagModule } from "../tag/tag.module"
import { WriteModule } from "../write/write.module"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ".env.development",
			ignoreEnvFile: process.env.NODE_ENV !== "dev",
			validationSchema: Joi.object({
				DATABASE_URL: Joi.string().required(),
				MASTER_ID: Joi.string().required(),
				MASTER_PW: Joi.string().required(),
				JWT_SECRET_KEY: Joi.string().required(),
				CLOUDFLARE_R2_ACCOUNT_ID: Joi.string().required(),
				CLOUDFLARE_R2_ACCESS_KEY_ID: Joi.string().required(),
				CLOUDFLARE_R2_SECRET_ACCESS_KEY: Joi.string().required(),
				CLOUDFLARE_R2_BUCKET_NAME: Joi.string().required(),
				CLOUDFLARE_R2_PUBLIC_URL: Joi.string().optional(),
				STORAGE_PROVIDER: Joi.string().required(),
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
		consumer.apply(LoggerMiddleware).forRoutes("*")
	}
}
