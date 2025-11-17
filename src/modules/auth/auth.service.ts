import { HttpStatus, Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { StandardHttpException } from "src/common/exception/standard-http.exception"
import { SignInDto } from "./dto/signIn.dto"

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	async signIn(signInDto: SignInDto) {
		const masterUsername = process.env.MASTER_ID
		const masterPassword = process.env.MASTER_PW

		const { password, username } = signInDto

		if (username !== masterUsername || password !== masterPassword) {
			throw new StandardHttpException(
				"로그인 정보가 올바르지 않습니다.",
				"INVALID_CREDENTIALS",
				HttpStatus.UNAUTHORIZED
			)
		}

		const payload = { username }

		return {
			data: {
				accessToken: await this.jwtService.signAsync(payload),
			},
		}
	}
}
