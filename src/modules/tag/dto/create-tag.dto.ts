import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class CreateTagDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: "tag 이름" })
	name: string
}
