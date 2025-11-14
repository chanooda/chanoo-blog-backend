import { ApiProperty } from "@nestjs/swagger"

export class ErrorResponseDto {
	@ApiProperty({
		description: "에러 메시지",
		example: "해당 id의 글이 존재하지 않습니다.",
	})
	message: string

	@ApiProperty({
		description: "에러 코드",
		example: "NOT_FOUND",
	})
	code: string

	@ApiProperty({
		description: "추가 정보 (선택적)",
		required: false,
	})
	value?: unknown
}
