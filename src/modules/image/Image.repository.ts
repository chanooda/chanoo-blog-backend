import { Injectable } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class ImageRepository {
	constructor(private prisma: PrismaService) {}

	async createImages(
		fileList: Array<Omit<Express.Multer.File, "buffer"> & { url: string }>
	) {
		const images = await this.prisma.image.createMany({
			data: fileList.map(({ destination, stream, path, encoding, ...file }) => ({
				...file,
			})),
		})

		return images
	}
}
