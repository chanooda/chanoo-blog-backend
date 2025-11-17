import { Module } from "@nestjs/common"
import { StorageModule } from "../storage/storage.module"
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
		FolderImageRepository,
		ImageRepository,
	],
	imports: [PrismaModule, StorageModule],
})
export class FolderModule {}
