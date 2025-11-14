import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { SeriesRepository } from "../series/series.repository"
import { TagRepository } from "../tag/tag.repository"
import { PublicWriteController } from "./public-write.controller"
import { WriteController } from "./write.controller"
import { WriteRepository } from "./write.repository"
import { WriteService } from "./write.service"
import { WriteTagRepository } from "./writeTag.repository"

@Module({
	controllers: [WriteController, PublicWriteController],
	providers: [
		WriteService,
		WriteRepository,
		SeriesRepository,
		TagRepository,
		WriteTagRepository,
	],
	imports: [PrismaModule],
})
export class WriteModule {}
