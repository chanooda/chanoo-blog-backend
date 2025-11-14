import { HttpException, HttpStatus } from "@nestjs/common"
import { ErrorResponseDto } from "../dto/error-response.dto"

export class StandardHttpException extends HttpException {
	constructor(
		message: string,
		code: string,
		status: HttpStatus = HttpStatus.BAD_REQUEST,
		value?: unknown
	) {
		const response: ErrorResponseDto = {
			message,
			code,
			...(value !== undefined && { value }),
		}
		super(response, status)
	}
}

