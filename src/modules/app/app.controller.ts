import { Controller } from "@nestjs/common"
import type { AppService } from "./app.service"

@Controller()
export class AppController {
	constructor(readonly _appService: AppService) {}
}
