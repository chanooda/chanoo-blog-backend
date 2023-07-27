import { HttpStatus } from '@nestjs/common';

export class CommonResponse<DATA = null, META = null> {
  status: HttpStatus;
  data?: DATA;
  meta?: META;
}

export class CommonDataDate {
  createdAt: Date;
  updatedAt: Date;
}
