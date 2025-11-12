/**
 * 지원하는 스토리지 프로바이더
 */
export enum StorageProvider {
	CLOUDFLARE_R2 = "cloudflare-r2",
	AWS_S3 = "aws-s3",
	// 향후 추가 가능한 프로바이더들
	// GOOGLE_CLOUD_STORAGE = "gcs",
	// AZURE_BLOB = "azure-blob",
}

