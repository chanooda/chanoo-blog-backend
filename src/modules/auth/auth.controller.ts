import { Body, Controller, HttpStatus, Post } from "@nestjs/common"
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { CommonResponse } from "src/common/dto/response.dto"
import { AuthService } from "./auth.service"
import { SignInResponseDto } from "./dto/sign-in-response.dto"
import { SignInDto } from "./dto/signIn.dto"

@ApiTags("auth")
@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@ApiOperation({ summary: "관리자 로그인" })
	@ApiOkResponse({
		type: SignInResponseDto,
		description: "로그인 성공 시 JWT 토큰 반환",
	})
	@Post("login")
	async signIn(
		@Body() signInDto: SignInDto
	): Promise<CommonResponse<SignInResponseDto>> {
		const result = await this.authService.signIn(signInDto)
		return {
			status: HttpStatus.OK,
			data: result.data,
		}
	}
}
