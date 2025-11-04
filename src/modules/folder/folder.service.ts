import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import type { FolderImage } from "generated/prisma"
import type { CommonResponse } from "src/common/dto/response.dto"
import { getFileNumber } from "src/utils/fileUtils"
import type { AwsRepository } from "../aws/aws.repository"
import type { FolderImageRepository } from "../folderImage/folderImage.repository"
import type { FolderCreateDto } from "./dto/folder-create.dto"
import type { FolderUpdateDto } from "./dto/folder-update.dto"
import type { GetFolderDataDto } from "./dto/folders-response.dto"
import type { FolderRepository } from "./folder.repository"

@Injectable()
export class FolderService {
	constructor(
		private folderRepository: FolderRepository,
		private awsRepository: AwsRepository,
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

	deleteFolder(id: number) {
		return this.folderRepository.deleteFolder(id)
	}

	async uploadImageFolder(
		id: number,
		file: Express.Multer.File
	): Promise<CommonResponse<FolderImage>> {
		const folder = await this.folderRepository.getFolderById(id)
		const filteredFile = file
		const fileName = filteredFile.originalname

		const fileNumber = getFileNumber(filteredFile.originalname)

		const duplicateImageCount =
			await this.folderImageRepository.getFolderImageById(id, fileName)

		if (duplicateImageCount > 0) {
			filteredFile.originalname = `${fileName.replace(
				fileNumber,
				""
			)} (${duplicateImageCount})`
		}

		const image = await this.awsRepository.imageUpload(folder.name, filteredFile)

		const folderImage = await this.folderImageRepository.createFolderImage(
			id,
			image
		)

		return { status: 200, data: folderImage }
	}

	async uploadImagesFolder(
		id: number,
		fileList: Array<Express.Multer.File>
	): Promise<CommonResponse> {
		try {
			const folder = await this.folderRepository.getFolderById(id)
			const folderImages = await this.folderImageRepository.getFolderImagesById(
				id,
				fileList
			)
			if (folderImages.some((folderImage) => folderImage)) {
				throw new HttpException(
					{
						status: HttpStatus.BAD_REQUEST,
						errorCode: "unique",
					},
					HttpStatus.BAD_REQUEST,
					{ cause: new Error() }
				)
			}
			const imageList = await this.awsRepository.imagesUpload(
				folder.name,
				fileList
			)

			await this.folderImageRepository.createFolderImages(id, imageList)

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
		console.log(folderImage)
		const _awsResponse = await this.awsRepository.imageDelete(name, image)
		return { status: 200 }
	}
}
