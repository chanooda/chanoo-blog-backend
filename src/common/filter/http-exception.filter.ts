import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	HttpStatus,
} from "@nestjs/common"
import { Response } from "express"
import { ErrorResponseDto } from "../dto/error-response.dto"

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()

		let status = HttpStatus.INTERNAL_SERVER_ERROR
		let message = "Internal server error"
		let code = "INTERNAL_SERVER_ERROR"
		let value: unknown

		if (exception instanceof HttpException) {
			status = exception.getStatus()
			const exceptionResponse = exception.getResponse()

			if (typeof exceptionResponse === "string") {
				message = exceptionResponse
				code = this.getErrorCodeFromStatus(status)
			} else if (typeof exceptionResponse === "object") {
				const responseObj = exceptionResponse as any

				// 이미 표준 형식인 경우 (StandardHttpException 또는 표준 형식으로 던진 경우)
				if (responseObj.message && responseObj.code) {
					message = responseObj.message
					code = responseObj.code
					value = responseObj.value
				}
				// NestJS 기본 형식인 경우 (ValidationPipe 등)
				else if (responseObj.message) {
					message = Array.isArray(responseObj.message)
						? responseObj.message.join(", ")
						: responseObj.message
					code = this.getErrorCodeFromStatus(status)
					// value는 error 필드나 전체 객체를 포함
					if (responseObj.error || Object.keys(responseObj).length > 1) {
						value = responseObj.error || responseObj
					}
				}
				// error 필드만 있는 경우
				else if (responseObj.error) {
					message =
						typeof responseObj.error === "string"
							? responseObj.error
							: "An error occurred"
					code = this.getErrorCodeFromStatus(status)
					value = responseObj.status ? { status: responseObj.status } : undefined
				}
				// 기타 객체 형식
				else {
					message = "An error occurred"
					code = this.getErrorCodeFromStatus(status)
					value = responseObj
				}
			}
		} else if (exception instanceof Error) {
			message = exception.message
			code = "INTERNAL_SERVER_ERROR"
		}

		const errorResponse: ErrorResponseDto = {
			message,
			code,
			...(value !== undefined && { value }),
		}

		response.status(status).json(errorResponse)
	}

	private getErrorCodeFromStatus(status: number): string {
		const statusCodeMap: Record<number, string> = {
			[HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
			[HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
			[HttpStatus.FORBIDDEN]: "FORBIDDEN",
			[HttpStatus.NOT_FOUND]: "NOT_FOUND",
			[HttpStatus.METHOD_NOT_ALLOWED]: "METHOD_NOT_ALLOWED",
			[HttpStatus.CONFLICT]: "CONFLICT",
			[HttpStatus.UNPROCESSABLE_ENTITY]: "UNPROCESSABLE_ENTITY",
			[HttpStatus.INTERNAL_SERVER_ERROR]: "INTERNAL_SERVER_ERROR",
			[HttpStatus.BAD_GATEWAY]: "BAD_GATEWAY",
			[HttpStatus.SERVICE_UNAVAILABLE]: "SERVICE_UNAVAILABLE",
		}

		return statusCodeMap[status] || "UNKNOWN_ERROR"
	}
}
