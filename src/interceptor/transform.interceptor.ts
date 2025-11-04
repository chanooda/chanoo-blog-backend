import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common"
import type { Observable } from "rxjs"
import { map } from "rxjs/operators"
import type { CommonResponse } from "src/common/dto/response.dto"

@Injectable()
export class TransformInterceptor<T>
	implements NestInterceptor<T, CommonResponse<T>>
{
	intercept(
		_context: ExecutionContext,
		next: CallHandler
	): Observable<CommonResponse<T>> {
		return next.handle().pipe(map((data) => ({ data, status: 200 })))
	}
}
