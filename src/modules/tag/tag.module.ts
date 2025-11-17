import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { TagController } from "./tag.controller"
import { TagRepository } from "./tag.repository"
import { TagService } from "./tag.service"

@Module({
	controllers: [TagController],
	providers: [TagService, TagRepository],
	imports: [PrismaModule],
})
export class TagModule {}
