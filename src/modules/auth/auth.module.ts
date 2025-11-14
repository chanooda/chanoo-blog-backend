import { DynamicModule, Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { JWT_SECRET_KEY } from "./auth.constant"
import { AuthController } from "./auth.controller"
import { AuthGuard } from "./auth.guard"
import { AuthService } from "./auth.service"
import { AuthModuleOption } from "./auth.types"

@Module({})
export class AuthModule {
	static forRoot(options: AuthModuleOption): DynamicModule {
		return {
			module: AuthModule,
			global: true,
			imports: [
				JwtModule.register({
					global: true,
					secret: options.privateKey,
					signOptions: {
						// @ts-expect-error - expiresIn accepts string or number
						expiresIn: options.expiresIn || "7d", // 기본값 7일
					},
				}),
			],
			controllers: [AuthController],
			providers: [
				{ provide: JWT_SECRET_KEY, useValue: options },
				AuthGuard,
				AuthService,
			],
			exports: [AuthGuard, JWT_SECRET_KEY],
		}
	}
}
