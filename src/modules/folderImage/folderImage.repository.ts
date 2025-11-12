import { Injectable } from "@nestjs/common"
import { Folder, FolderImage } from "generated/prisma"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class FolderImageRepository {
	constructor(private prisma: PrismaService) {}

	async createFolderImages(
		folderId: number,
		fileList: Array<
			Omit<Express.Multer.File, "buffer"> & { url: string; pathname: string }
		>
	) {
		try {
			await this.prisma.folderImage.createMany({
				data: fileList?.map(({ destination, path, stream, ...file }) => ({
					...file,
					folderId,
				})),
			})
		} catch (error) {
			throw new Error(error)
		}
	}

	async createFolderImage(
		folderId: number,
		file: Omit<Express.Multer.File, "buffer"> & { url: string; pathname: string }
	) {
		try {
			const { path, stream, destination, encoding, ...fileInfo } = file
			console.log("fileInfo")
			console.log(fileInfo)
			console.log("\n")
			const image = await this.prisma.folderImage.create({
				data: {
					folderId,
					...fileInfo,
				},
			})
			return image
		} catch (error) {
			throw new Error(error)
		}
	}

	async getFolderImageByIdAndPathname(folderId: number, pathname: string) {
		const folderImage = await this.prisma.folderImage.findMany({
			where: {
				AND: {
					folderId,
					pathname,
				},
			},
		})

		console.log("folderImage")
		console.log(folderImage)
		console.log("\n")

		return folderImage.length
	}

	async getFolderImagesByIdAndPathname(
		folderId: number,
		fileList: Array<Omit<Express.Multer.File, "buffer"> & { pathname: string }>
	) {
		const folderImages = await Promise.all(
			fileList.map((file) =>
				this.prisma.folderImage.findFirst({
					where: {
						AND: {
							folderId,
							pathname: file.pathname,
						},
					},
				})
			)
		)

		console.log("folderImages")
		console.log(folderImages)
		console.log("\n")

		return folderImages
	}

	async deleteFolderImage(
		id: number
	): Promise<FolderImage & { folder: Folder }> {
		try {
			const folderImage = await this.prisma.folderImage.delete({
				where: {
					id,
				},
				include: {
					folder: true,
				},
			})

			return folderImage
		} catch (error) {
			throw new Error(error)
		}
	}
}
