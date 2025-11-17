import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { Folder } from "generated/prisma"
import { PrismaService } from "src/modules/prisma/prisma.service"
import { FolderCreateDto } from "./dto/folder-create.dto"
import { FolderUpdateDto } from "./dto/folder-update.dto"
import { GetFolderDataDto } from "./dto/folders-response.dto"

@Injectable()
export class FolderRepository {
	constructor(private prisma: PrismaService) {}

	async createFolder(createFolderDto: FolderCreateDto): Promise<Folder> {
		try {
			const folder = await this.prisma.folder.create({
				data: createFolderDto,
			})
			return folder
		} catch (e) {
			console.error(e)

			if (e.code === "P2002") {
				throw new HttpException(
					{
						status: HttpStatus.NOT_FOUND,
						error: "중복된 이름의 폴더입니다.",
					},
					HttpStatus.NOT_FOUND
				)
			}
		}
	}

	async getTopFolders(): Promise<GetFolderDataDto[]> {
		const folders = await this.prisma.folder.findMany({
			where: {
				parentId: null,
			},
			include: {
				child: true,
				parent: true,
				_count: {
					select: {
						folderImage: true,
					},
				},
			},
		})

		return folders || []
	}

	async getFolders(): Promise<GetFolderDataDto[]> {
		try {
			const folders = await this.prisma.folder.findMany({
				include: {
					child: true,
					parent: true,
					_count: {
						select: {
							folderImage: true,
						},
					},
				},
			})
			return folders || []
		} catch (error) {
			throw new Error(error)
		}
	}

	async getFolderById(id: number): Promise<GetFolderDataDto> {
		try {
			const folder = await this.prisma.folder.findUnique({
				where: { id: id },
				include: {
					child: true,
					parent: true,
					folderImage: true,
				},
			})

			if (!folder) {
				throw new HttpException(
					{
						status: HttpStatus.NOT_FOUND,
						error: "해당 id의 유저가 존재하지 않습니다.",
					},
					HttpStatus.NOT_FOUND
				)
			}

			return folder
		} catch (error) {
			throw new Error(error)
		}
	}

	async patchFolder(id: number, FolderUpdateDto: FolderUpdateDto) {
		const { child, parentId, ...rest } = FolderUpdateDto

		const folder = await this.prisma.folder.update({
			where: {
				id,
			},
			data: {
				...rest,
				parentId,
				child: {
					connect: child?.map((id) => ({ id })) || [],
				},
			},
		})

		return folder
	}

	async deleteFolder(id: number) {
		try {
			await this.prisma.folder.delete({
				where: {
					id,
				},
			})
			return
		} catch (error) {
			console.error(error)
			throw new HttpException(
				{
					status: HttpStatus.NOT_FOUND,
					error: "해당 id의 폴더가 존재하지 않습니다.",
				},
				HttpStatus.NOT_FOUND,
				{ cause: error }
			)
		}
	}
}
