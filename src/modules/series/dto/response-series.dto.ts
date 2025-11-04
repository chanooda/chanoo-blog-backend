import { ApiProperty } from "@nestjs/swagger"

export class SeriesResDto {
	@ApiProperty({ description: "시리즈 id" })
	id: number

	@ApiProperty({ description: "시리즈 이름" })
	name: string
}

export class GetSeriesDto {
	@ApiProperty({ type: SeriesResDto, isArray: false })
	data: SeriesResDto
}

export class GetSeriesAllDto {
	@ApiProperty({ type: SeriesResDto, isArray: true })
	data: SeriesResDto[]
}
