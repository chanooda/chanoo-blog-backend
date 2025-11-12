import { applyDecorators, UseInterceptors } from "@nestjs/common"
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express"
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface"
import { ApiBody, ApiConsumes } from "@nestjs/swagger"

export function ApiFiles(
	fieldName = "files",
	maxCount?: number,
	options?: MulterOptions
) {
	return applyDecorators(
		UseInterceptors(FilesInterceptor(fieldName, maxCount, options)),
		ApiConsumes("multipart/form-data"),
		ApiBody({
			schema: {
				type: "object",
				properties: {
					[fieldName]: {
						type: "string",
						format: "binary",
					},
				},
			},
		})
	)
}

export function ApiFile(fieldName = "file") {
	return applyDecorators(
		UseInterceptors(FileInterceptor(fieldName)),
		ApiConsumes("multipart/form-data"),
		ApiBody({
			required: true,
			type: "multipart/form-data",
			schema: {
				type: "object",
				properties: {
					[fieldName]: {
						type: "string",
						format: "binary",
					},
				},
			},
		})
	)
}
