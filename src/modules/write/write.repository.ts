import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { Prisma } from "generated/prisma"

import { IdRes } from "src/common/dto/response.dto"
import { PrismaService } from "../prisma/prisma.service"
import { CreateWriteDto } from "./dto/create-write.dto"
import { WriteFindAllDto } from "./dto/find-write.dto"
import { UpdateWriteDto } from "./dto/update-write.dto"

@Injectable()
export class WriteRepository {
	constructor(private prisma: PrismaService) {}

	async create(createWriteDto: CreateWriteDto): Promise<IdRes> {
		const { content, isPublish, title, imgUrl, seriesName, tagNames, plainText } =
			createWriteDto

		try {
			const parsedTagNames: string[] = JSON.parse(String(tagNames) || "[]")
			const write = await this.prisma.$transaction(async (tx) => {
				const write = await tx.write.create({
					data: {
						isPublish,
						title,
						content,
						...(plainText && { plainText }),
						...(imgUrl && { imgUrl }),
						...(seriesName && {
							series: {
								connectOrCreate: {
									create: {
										name: seriesName,
									},
									where: {
										name: seriesName,
									},
								},
							},
						}),
						...(parsedTagNames &&
							parsedTagNames.length > 0 && {
								tags: {
									create: parsedTagNames?.map((tagName) => ({
										tag: {
											connectOrCreate: {
												create: {
													name: tagName,
												},
												where: {
													name: tagName,
												},
											},
										},
									})),
								},
							}),
					},
				})

				if (seriesName) {
					const series = await tx.series.findFirst({
						where: {
							name: seriesName,
						},
					})

					const seriesOrder: Prisma.JsonArray =
						(series?.writeOrder as Prisma.JsonArray) || []

					await tx.series.update({
						where: {
							name: seriesName,
						},
						data: {
							writeOrder: [...seriesOrder, write.id],
						},
					})
				}

				console.log(write)

				return write
			})

			return { id: write.id }
		} catch (error) {
			console.error(error)
			throw new HttpException(
				{ error, status: HttpStatus.BAD_REQUEST },
				HttpStatus.BAD_REQUEST
			)
		}
	}

	async update(id: number, updateWriteDto: UpdateWriteDto): Promise<IdRes> {
		const { content, isPublish, title, imgUrl, seriesName, tagNames, plainText } =
			updateWriteDto

		const parsedTagNames: string[] = JSON.parse(String(tagNames) || "[]")

		try {
			const write = await this.prisma.$transaction(async (tx) => {
				const deletedWritesTags = []

				const writesTags = await tx.writesTag.findMany({
					where: {
						writeId: id,
					},
					include: {
						tag: true,
					},
				})

				writesTags?.forEach((writeTag) => {
					const index = parsedTagNames.indexOf(writeTag.tag.name)
					if (index === -1) {
						deletedWritesTags.push(writeTag)
					} else {
						parsedTagNames.splice(index, 1)
					}
				})

				const write = await tx.write.update({
					data: {
						isPublish,
						title,
						content,
						...(plainText && { plainText }),
						...(imgUrl && { imgUrl }),
						...(seriesName
							? {
									series: {
										connectOrCreate: {
											create: {
												name: seriesName,
											},
											where: {
												name: seriesName,
											},
										},
									},
								}
							: {
									series: {
										disconnect: true,
									},
								}),
						tags: {
							delete: deletedWritesTags?.map((deletedWritesTag) => ({
								id: deletedWritesTag.id,
							})),
							create: parsedTagNames?.map((name) => ({
								tag: {
									connectOrCreate: {
										create: {
											name: name,
										},
										where: {
											name: name,
										},
									},
								},
							})),
						},
					},
					where: {
						id,
					},
				})

				if (seriesName) {
					const series = await tx.series.findFirst({
						where: {
							name: seriesName,
						},
					})

					const seriesOrder: Prisma.JsonArray =
						(series?.writeOrder as Prisma.JsonArray) || []

					if (!seriesOrder.includes(write.id))
						await tx.series.update({
							where: {
								name: seriesName,
							},
							data: {
								writeOrder: [...seriesOrder, write.id],
							},
						})
				}

				return write
			})
			return { id: write.id }
		} catch (error) {
			console.error(error)
			throw new HttpException(
				{ error, status: HttpStatus.BAD_REQUEST },
				HttpStatus.BAD_REQUEST
			)
		}
	}

	async findAll(writeFindAllDto: WriteFindAllDto) {
		const { limit, page, search, seriesId, tagId, isPublish } = writeFindAllDto

		try {
			const prisma = this.prisma.$extends({
				result: {
					write: {
						plainText: {
							needs: { plainText: true },
							compute(write) {
								return write.plainText?.slice(0, 600)
							},
						},
					},
				},
			})
			const writes = await prisma.write.findMany({
				skip: page * 10 || 0,
				take: limit || 10,
				where: {
					...(search && {
						title: {
							contains: search || "",
						},
					}),
					...(tagId && {
						tags: {
							some: {
								tagId: tagId,
							},
						},
					}),
					...(seriesId && { seriesId }),
					...(isPublish && { isPublish }),
				},
				include: {
					series: true,
					tags: {
						select: {
							tag: true,
						},
					},
				},
				omit: {
					content: true,
				},
				orderBy: {
					createdAt: "desc",
				},
			})

			// tags: [{ tag: { id, name } }] -> [{ id, name }]
			const flattened = (writes || []).map((write) => ({
				...write,
				tags: (write.tags || []).map(
					(wt: { tag: { id: number; name: string } }) => wt.tag
				),
			}))

			return flattened
		} catch (error) {
			console.error(error)
			throw new HttpException(
				{ error, status: HttpStatus.BAD_REQUEST },
				HttpStatus.BAD_REQUEST
			)
		}
	}

	async findOne(id: number) {
		try {
			const write = await this.prisma.write.findUnique({
				where: {
					id,
				},
				include: {
					series: {
						include: {
							writes: {
								select: {
									id: true,
									title: true,
								},
							},
						},
					},
					tags: {
						select: {
							tag: true,
						},
					},
				},
			})
			if (!write) {
				throw new HttpException(
					{
						status: HttpStatus.NOT_FOUND,
						error: "해당 id의 유저가 존재하지 않습니다.",
					},
					HttpStatus.NOT_FOUND
				)
			}
			return {
				...write,
				tags: (write.tags || []).map(
					(wt: { tag: { id: number; name: string } }) => wt.tag
				),
			}
		} catch (error) {
			console.error(error)
			throw new HttpException(
				{
					status: HttpStatus.EXPECTATION_FAILED,
					error: error,
				},
				HttpStatus.EXPECTATION_FAILED
			)
		}
	}

	async delete(id: number) {
		try {
			await this.prisma.$transaction(async (tx) => {
				const write = await tx.write.delete({
					where: {
						id,
					},
					include: {
						tags: {
							select: {
								tag: {
									select: {
										id: true,
										writes: {
											take: 1,
										},
									},
								},
							},
						},
					},
				})

				if (!write) {
					throw new HttpException(
						{
							status: HttpStatus.NOT_FOUND,
							error: "해당 id의 유저가 존재하지 않습니다.",
						},
						HttpStatus.NOT_FOUND
					)
				}

				if (write?.seriesId) {
					const series = await tx.series.findFirst({
						where: {
							id: write.seriesId,
						},
						include: {
							writes: {
								select: {
									_count: true,
								},
							},
						},
					})

					const seriesOrder: Prisma.JsonArray =
						(series?.writeOrder as Prisma.JsonArray) || []

					if (seriesOrder.includes(write.id)) {
						const deletedWriteOrder = seriesOrder.filter((id) => write.id !== id)
						if (deletedWriteOrder.length > 0) {
							tx.series.update({
								where: { id: write.seriesId },
								data: {
									writeOrder: deletedWriteOrder,
								},
							})
						}
					}

					if (series.writes.length === 0) {
						await tx.series.delete({
							where: {
								id: series.id,
							},
						})
					}
				}
				if (write.tags.length > 0) {
					// 글이 없는 tag가 있으면 삭제
					const writeTag = write.tags.filter(
						(writeTag) => writeTag.tag.writes.length === 1
					)
					console.log(write)
					console.log("-------------------------")
					console.log(writeTag)
					console.log("-------------------------")
					console.log(writeTag.map((tag) => tag.tag.id))
					if (writeTag.length > 0) {
						await tx.tag.deleteMany({
							where: {
								id: {
									in: writeTag.map((tag) => tag.tag.id),
								},
							},
						})
					}
				}
			})
		} catch (error) {
			console.log(error)
			console.log("aslkdfjlasjdflkajsdfja")
			throw new HttpException(
				{
					status: HttpStatus.EXPECTATION_FAILED,
					error: error,
				},
				HttpStatus.EXPECTATION_FAILED
			)
		}
	}

	async writeIdList() {
		try {
			const writeList = await this.prisma.write.findMany({
				select: {
					id: true,
				},
			})
			return writeList
		} catch (e) {
			throw new HttpException(
				{
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					error: e,
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}
}
