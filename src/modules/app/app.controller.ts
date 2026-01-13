import { Controller, Get } from "@nestjs/common"
import { AppService } from "./app.service"

@Controller()
export class AppController {
	constructor(readonly _appService: AppService) {}

	@Get("health")
	getHealth() {
		return {
			status: "ok ok ok",
			timestamp: new Date().toISOString(),
		}
	}
}
