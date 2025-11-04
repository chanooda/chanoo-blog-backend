import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class CreateSeriesDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: "시리즈 이름" })
	name: string
}
