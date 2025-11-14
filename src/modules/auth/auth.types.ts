export interface AuthModuleOption {
	privateKey: string
	expiresIn?: string | number // JWT 토큰 유효기간 (예: "1h", "7d", "30m", 3600)
}
