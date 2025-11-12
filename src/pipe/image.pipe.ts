import {
	type ArgumentMetadata,
	Injectable,
	type PipeTransform,
} from "@nestjs/common"
import * as sharp from "sharp"
import { getFileName } from "src/utils/fileUtils"

@Injectable()
export class TransformImage implements PipeTransform {
	maxWidth = 800
	maxHeight = 1000
	async transform(
		value: Express.Multer.File,
		_metadata: ArgumentMetadata
	): Promise<Express.Multer.File> {
		const image = sharp(value.buffer)
		const { width, height } = await image.metadata()

		if (width > height && width > this.maxWidth) {
			image.resize({ width: this.maxWidth, fit: "contain" })
		}
		if (height > width && height > this.maxHeight) {
			image.resize({ height: this.maxHeight, fit: "contain" })
		}
		const parsedImage = await image.withMetadata().toFormat("webp").toBuffer()

		return {
			...value,
			buffer: parsedImage,
			mimetype: "image/webp",
			originalname: `${getFileName(value.originalname)}`,
		}
	}
}
