import {
	type CanActivate,
	type ExecutionContext,
	Inject,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common"
import type { JwtService } from "@nestjs/jwt"
import type { Request } from "express"
import { JWT_SECRET_KEY } from "./auth.constant"
import type { AuthModuleOption } from "./auth.types"

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
			throw new UnauthorizedException()
		}
		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: this._configOptions.privateKey,
			})
			// 💡 We're assigning the payload to the request object here
			// so that we can access it in our route handlers
			request.master = payload
		} catch {
			throw new UnauthorizedException()
		}
		return true
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(" ") ?? []
		return type === "Bearer" ? token : undefined
	}
}
