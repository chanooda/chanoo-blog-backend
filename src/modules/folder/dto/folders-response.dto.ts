import { ApiProperty, getSchemaPath } from "@nestjs/swagger"
import type { Folder } from "generated/prisma"

export class BaseFolderDto {
	@ApiProperty({ description: "폴더 ID" })
	id: number
	@ApiProperty({ description: "폴더 이름" })
	name: string
	@ApiProperty({ description: "상위 폴더 ID", default: null })
	parentId: number
	@ApiProperty({
		description: "하위 폴더들",
		default: [],
		isArray: true,
		type: BaseFolderDto,
		minimum: 0,
		minItems: 0,
		items: {
			type: getSchemaPath(BaseFolderDto),
		},
	})
	child: Folder[]
	@ApiProperty({
		description: "상위 폴더",
		default: null,
		type: BaseFolderDto,
	})
	parent: Folder
}

export class GetFolderDataDto extends BaseFolderDto implements Folder {}

export class GetFoldersDto {
	@ApiProperty({ type: GetFolderDataDto, isArray: true })
	data: GetFolderDataDto[]
}

export class GetFolderDto {
	@ApiProperty({ type: GetFolderDataDto, isArray: true })
	data: GetFolderDataDto
}
