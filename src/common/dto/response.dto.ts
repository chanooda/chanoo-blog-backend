import type { HttpStatus } from "@nestjs/common"
import { IsNumberString } from "class-validator"

export class CommonResponse<DATA = null, META = null> {
	status: HttpStatus
	data?: DATA
	meta?: META
}

export class CommonDataDate {
	createdAt: Date
	updatedAt: Date
}

export class IdReq {
	@IsNumberString()
	id: number
}

export class IdRes {
	id: number
}

export class CommonError {
	error: string
	status: HttpStatus
}
