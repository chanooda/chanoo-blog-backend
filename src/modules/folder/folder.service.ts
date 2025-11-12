import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { FolderImage } from "generated/prisma"
import { CommonResponse } from "src/common/dto/response.dto"
import { getFileNumber } from "src/utils/fileUtils"
import { FolderImageRepository } from "../folderImage/folderImage.repository"
import { StorageService } from "../storage/storage.service"
import { FolderCreateDto } from "./dto/folder-create.dto"
import { FolderUpdateDto } from "./dto/folder-update.dto"
import { GetFolderDataDto } from "./dto/folders-response.dto"
import { FolderRepository } from "./folder.repository"

@Injectable()
export class FolderService {
	constructor(
		private folderRepository: FolderRepository,
		private storageService: StorageService,
		private folderImageRepository: FolderImageRepository
	) {}

	async getFolders(): Promise<CommonResponse<GetFolderDataDto[]>> {
		const folders = await this.folderRepository.getFolders()
		return {
			status: HttpStatus.OK,
			data: folders,
		}
	}

	async getTopFolders(): Promise<CommonResponse<GetFolderDataDto[]>> {
		const folders = await this.folderRepository.getTopFolders()
		return {
			status: HttpStatus.OK,
			data: folders,
		}
	}

	async getFolderById(id: number): Promise<CommonResponse<GetFolderDataDto>> {
		const folder = await this.folderRepository.getFolderById(id)
		return {
			status: HttpStatus.OK,
			data: folder,
		}
	}

	async createFolder(createFolderDto: FolderCreateDto) {
		return await this.folderRepository.createFolder(createFolderDto)
	}

	async patchFolder(id: number, folderUpdateDto: FolderUpdateDto) {
		return await this.folderRepository.patchFolder(id, folderUpdateDto)
	}

	async deleteFolder(id: number) {
		return this.folderRepository.deleteFolder(id)
	}

	private buildFolderPath(folder: GetFolderDataDto): string {
		const pathParts: string[] = []
		let currentFolder: GetFolderDataDto | null = folder

		while (currentFolder) {
			pathParts.unshift(currentFolder.name)
			currentFolder = currentFolder.parent as GetFolderDataDto | null
		}

		return pathParts.join("/")
	}

	async uploadImageFolder(
		id: number,
		file: Express.Multer.File
	): Promise<CommonResponse<FolderImage>> {
		const folder = await this.folderRepository.getFolderById(id)
		const filteredFile = file

		const folderPath = this.buildFolderPath(folder)
		const fileName = filteredFile.originalname
		let pathname = `${folderPath}/${filteredFile.originalname}`

		const fileNumber = getFileNumber(filteredFile.originalname)

		const duplicateImageCount =
			await this.folderImageRepository.getFolderImageByIdAndPathname(id, pathname)

		if (duplicateImageCount > 0) {
			filteredFile.originalname = `${fileName.replace(
				fileNumber,
				""
			)} (${duplicateImageCount})`
			pathname = `${folderPath}/${filteredFile.originalname}`
		}

		const image = await this.storageService.uploadImage(folder.name, filteredFile)

		const folderImage = await this.folderImageRepository.createFolderImage(id, {
			...image,
			pathname,
		})

		return { status: 200, data: folderImage }
	}

	async uploadImagesFolder(
		id: number,
		fileList: Array<Express.Multer.File>
	): Promise<CommonResponse> {
		try {
			const folder = await this.folderRepository.getFolderById(id)
			const folderImages =
				await this.folderImageRepository.getFolderImagesByIdAndPathname(id, [
					...fileList.map((file) => ({
						...file,
						pathname: `${this.buildFolderPath(folder)}/${file.originalname}`,
					})),
				])

			if (folderImages.length > 0) {
				throw new HttpException(
					{
						status: HttpStatus.BAD_REQUEST,
						errorCode: "unique",
					},
					HttpStatus.BAD_REQUEST,
					{ cause: new Error() }
				)
			}
			const imageList = await this.storageService.uploadImages(
				folder.name,
				fileList
			)

			await this.folderImageRepository.createFolderImages(
				id,
				imageList.map((image) => ({
					...image,
					pathname: `${this.buildFolderPath(folder)}/${image.originalname}`,
				}))
			)

			return { status: 200 }
		} catch (error) {
			throw new Error(error)
		}
	}

	async deleteFolderImage(id: number): Promise<CommonResponse> {
		const folderImage = await this.folderImageRepository.deleteFolderImage(id)

		const {
			folder: { name },
			...image
		} = folderImage

		await this.storageService.deleteImage(name, image)
		return { status: 200 }
	}
}
