import { Module } from "@nestjs/common"
import { AwsRepository } from "../aws/aws.repository"
import { FolderImageRepository } from "../folderImage/folderImage.repository"
import { ImageRepository } from "../image/Image.repository"
import { PrismaModule } from "../prisma/prisma.module"
import { FolderController } from "./folder.controller"
import { FolderRepository } from "./folder.repository"
import { FolderService } from "./folder.service"

@Module({
	controllers: [FolderController],
	providers: [
		FolderService,
		FolderRepository,
		AwsRepository,
		FolderImageRepository,
		ImageRepository,
	],
	imports: [PrismaModule],
})
export class FolderModule {}
