import {
	type CanActivate,
	type ExecutionContext,
	HttpStatus,
	Inject,
	Injectable,
} from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Request } from "express"
import { StandardHttpException } from "src/common/exception/standard-http.exception"
import { JWT_SECRET_KEY } from "./auth.constant"
import { AuthModuleOption } from "./auth.types"

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		@Inject(JWT_SECRET_KEY) readonly _configOptions: AuthModuleOption
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()
		const token = this.extractTokenFromHeader(request)
		if (!token) {
			throw new StandardHttpException(
				"인증 토큰이 필요합니다.",
				"MISSING_TOKEN",
				HttpStatus.UNAUTHORIZED
			)
		}
		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: this._configOptions.privateKey,
			})
			// 💡 We're assigning the payload to the request object here
			// so that we can access it in our route handlers
			request.master = payload
		} catch {
			throw new StandardHttpException(
				"유효하지 않은 인증 토큰입니다.",
				"INVALID_TOKEN",
				HttpStatus.UNAUTHORIZED
			)
		}
		return true
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(" ") ?? []
		return type === "Bearer" ? token : undefined
	}
}
