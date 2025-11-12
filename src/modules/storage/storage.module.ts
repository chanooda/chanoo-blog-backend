import { Module } from "@nestjs/common"
import { StorageFactory } from "./storage.factory"
import { StorageService } from "./storage.service"

/**
 * 스토리지 모듈
 * 스토리지 서비스와 팩토리를 제공
 */
@Module({
	providers: [StorageFactory, StorageService],
	exports: [StorageService],
})
export class StorageModule {}
