import { Injectable } from "@nestjs/common"
import { FolderImage } from "generated/prisma"
import { StorageFactory } from "./storage.factory"
import { IStorageService } from "./storage.interface"

/**
 * 스토리지 서비스 메인 클래스
 * Factory를 통해 적절한 프로바이더를 사용
 */
@Injectable()
export class StorageService implements IStorageService {
	private readonly storageService: IStorageService

	constructor(private readonly storageFactory: StorageFactory) {
		this.storageService = this.storageFactory.createStorageService()
	}

	async uploadImage(
		folder: string,
		image: Express.Multer.File
	): Promise<Omit<Express.Multer.File, "buffer"> & { url: string }> {
		return this.storageService.uploadImage(folder, image)
	}

	async uploadImages(
		folder: string,
		images: Array<Express.Multer.File>
	): Promise<(Omit<Express.Multer.File, "buffer"> & { url: string })[]> {
		return this.storageService.uploadImages(folder, images)
	}

	async deleteImage(folder: string, image: FolderImage): Promise<void> {
		return this.storageService.deleteImage(folder, image)
	}
}
