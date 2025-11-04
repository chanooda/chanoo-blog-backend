import { ApiProperty } from "@nestjs/swagger"
import { TagResDto } from "src/modules/tag/dto/response-tag.dto"
import type { WriteResDto } from "./response-write.dto"

export class WriteTagTagResDto {
	@ApiProperty({ description: "태그 id", type: "number" })
	id: number

	@ApiProperty({ description: "태그 id", type: "number" })
	tagId: number

	@ApiProperty({ description: "글 id", type: "number" })
	writeId: number

	@ApiProperty({ description: "태그", type: TagResDto })
	tag: TagResDto
}

export class WriteTagWriteResDto {
	@ApiProperty({ description: "태그+글 id" })
	id: number

	@ApiProperty({ description: "태그 id" })
	tagId: number

	@ApiProperty({ description: "글 id" })
	writeId: number

	@ApiProperty({ description: "글" })
	write: WriteResDto
}
