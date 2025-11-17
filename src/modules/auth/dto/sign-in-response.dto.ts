import { ApiProperty } from "@nestjs/swagger"

export class SignInResponseDto {
	@ApiProperty({
		description: "JWT 액세스 토큰",
	})
	accessToken: string
}
