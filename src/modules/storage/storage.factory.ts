import { Injectable } from "@nestjs/common"
import { R2StorageService } from "./providers/r2-storage.service"
import { S3StorageService } from "./providers/s3-storage.service"
import { IStorageService } from "./storage.interface"
import { StorageProvider } from "./storage-provider.enum"

/**
 * 스토리지 서비스 팩토리
 * 환경 변수에 따라 적절한 스토리지 프로바이더를 생성
 */
@Injectable()
export class StorageFactory {
	/**
	 * 환경 변수에 따라 스토리지 서비스 인스턴스를 생성
	 * @returns IStorageService 구현체
	 */
	createStorageService(): IStorageService {
		const provider = this.getStorageProvider()

		switch (provider) {
			case StorageProvider.CLOUDFLARE_R2:
				return new R2StorageService()
			case StorageProvider.AWS_S3:
				return new S3StorageService()
			default:
				throw new Error(
					`Unsupported storage provider: ${provider}. Please set STORAGE_PROVIDER environment variable.`
				)
		}
	}

	/**
	 * 환경 변수에서 스토리지 프로바이더를 읽어옴
	 * 기본값: CLOUDFLARE_R2
	 */
	private getStorageProvider(): StorageProvider {
		const provider = process.env.STORAGE_PROVIDER

		if (!provider) {
			// 기본값: R2 사용
			return StorageProvider.CLOUDFLARE_R2
		}

		// enum 값으로 변환
		const normalizedProvider = provider.toLowerCase().replace(/_/g, "-")

		if (
			Object.values(StorageProvider).includes(
				normalizedProvider as StorageProvider
			)
		) {
			return normalizedProvider as StorageProvider
		}

		throw new Error(
			`Invalid storage provider: ${provider}. Supported providers: ${Object.values(StorageProvider).join(", ")}`
		)
	}
}
