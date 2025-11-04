import { Injectable } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"
import type { CreateTagDto } from "./dto/create-tag.dto"
import type { UpdateTagDto } from "./dto/update-tag.dto"

@Injectable()
export class TagRepository {
	constructor(private prisma: PrismaService) {}

	async create(createTagDto: CreateTagDto) {
		try {
			const { name } = createTagDto
			const tag = await this.prisma.tag.create({
				data: {
					name,
				},
			})
			return tag
		} catch (error) {
			console.error(error)
			throw new Error(error)
		}
	}

	async createMany(tagNames: string[]) {
		try {
			const tag = await this.prisma.tag.createMany({
				data: tagNames?.map((tag) => ({ name: tag })),
			})
			return tag
		} catch (error) {
			console.error(error)
			throw new Error(error)
		}
	}

	async update(id: number, updateTagDto: UpdateTagDto) {
		try {
			const { name } = updateTagDto
			const tag = await this.prisma.tag.update({
				data: {
					name,
				},
				where: {
					id,
				},
			})
			return tag
		} catch (error) {
			console.error(error)
			throw new Error(error)
		}
	}

	async delete(id: number) {
		try {
			await this.prisma.tag.delete({
				where: {
					id,
				},
			})
		} catch (error) {
			console.error(error)
			throw new Error(error)
		}
	}

	async findAll() {
		try {
			const tag = await this.prisma.tag.findMany()
			return tag || []
		} catch (error) {
			console.error(error)
			throw new Error(error)
		}
	}

	async findMany(names: string[]) {
		try {
			const tags = await this.prisma.tag.findMany({
				where: {
					name: {
						in: names,
					},
				},
			})
			return tags || []
		} catch (error) {
			console.error(error)
			throw new Error(error)
		}
	}

	async findTagWithWrite(id: number) {
		try {
			const tags = await this.prisma.tag.findUnique({
				where: {
					id,
				},
				include: {
					writes: {
						include: {
							write: true,
						},
					},
				},
			})
			return tags || []
		} catch (error) {
			console.error(error)
			throw new Error(error)
		}
	}
}
