import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonResponse } from 'src/common/dto/response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, CommonResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<CommonResponse<T>> {
    return next.handle().pipe(map((data) => ({ data, status: 200 })));
  }
}
