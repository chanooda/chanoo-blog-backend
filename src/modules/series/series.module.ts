import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { SeriesController } from "./series.controller"
import { SeriesRepository } from "./series.repository"
import { SeriesService } from "./series.service"

@Module({
	controllers: [SeriesController],
	providers: [SeriesService, SeriesRepository],
	imports: [PrismaModule],
})
export class SeriesModule {}
