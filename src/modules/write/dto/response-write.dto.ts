import { ApiProperty, getSchemaPath, OmitType } from "@nestjs/swagger"
import { SeriesResDto } from "src/modules/series/dto/response-series.dto"
import { TagResDto } from "src/modules/tag/dto/response-tag.dto"

export class WriteResDto {
	@ApiProperty({ description: "글 id" })
	id: number

	@ApiProperty({ description: "글 제목" })
	title: string

	@ApiProperty({ description: "메인 이미지 url" })
	imgUrl: string

	@ApiProperty({ description: "시리즈 id" })
	seriesId: number

	@ApiProperty({ description: "글 본문" })
	content: string

	@ApiProperty({ description: "게시여부" })
	isPublish: boolean

	@ApiProperty({ description: "조회수" })
	view: number

	@ApiProperty({ description: "좋아요" })
	heart: number

	@ApiProperty({ description: "생성일" })
	createdAt: Date

	@ApiProperty({ description: "수정일" })
	updatedAt: Date

	@ApiProperty({ description: "마크다운 제거된 본문" })
	plainText: string
}

export class WriteFullResDto extends OmitType(WriteResDto, ["content"]) {
	@ApiProperty({ description: "series" })
	series: SeriesResDto

	@ApiProperty({
		description: "태그",
		default: [],
		type: TagResDto,
		items: {
			type: getSchemaPath(TagResDto),
		},
	})
	tags: TagResDto[]
}

export class GetWriteDto {
	@ApiProperty({ type: WriteFullResDto, isArray: false })
	data: WriteFullResDto
}

export class GetWritesDto {
	@ApiProperty({ type: WriteFullResDto, isArray: true })
	data: WriteFullResDto[]
}
