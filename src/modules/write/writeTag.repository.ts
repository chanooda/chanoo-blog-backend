import { Injectable } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class WriteTagRepository {
	constructor(private prisma: PrismaService) {}

	async create(writeId: number, tagIds: number[]) {
		try {
			const writeTag = await this.prisma.writesTag.createMany({
				data: tagIds?.map((tagId) => ({
					tagId: tagId,
					writeId,
				})),
			})
			console.log(writeTag)
			return writeTag
		} catch (e) {
			console.error(e)
		}
	}

	async findOne(id: number) {
		try {
			const writeTag = await this.prisma.writesTag.findUnique({
				where: {
					id,
				},
				include: {
					tag: true,
					write: true,
				},
			})
			return writeTag
		} catch (error) {
			console.log(error)
		}
	}

	async findAll() {
		try {
			const writeTag = await this.prisma.writesTag.findMany()
			return writeTag
		} catch (error) {
			console.log(error)
		}
	}
}
