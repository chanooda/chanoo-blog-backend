import { ApiProperty } from "@nestjs/swagger"
import { WriteTagWriteResDto } from "src/modules/write/dto/response-writeTag.dto"

export class TagResDto {
	@ApiProperty({
		description: "태그 id",
		type: "number",
	})
	id: number

	@ApiProperty({ description: "태그 이름", type: "string" })
	name: string
}

export class TagWithWriteDto {
	@ApiProperty({ description: "글" })
	writes: WriteTagWriteResDto
}

export class GetTagResDto {
	@ApiProperty({ type: TagResDto, isArray: false })
	data: TagResDto
}

export class GetTagsResDto {
	@ApiProperty({ type: TagResDto, isArray: true })
	data: TagResDto[]
}

export class GetTagWithWriteResDto {
	@ApiProperty({ type: TagWithWriteDto, isArray: false })
	data: TagWithWriteDto
}
