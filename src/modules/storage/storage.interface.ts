import { FolderImage } from "generated/prisma"

/**
 * 스토리지 서비스 인터페이스
 * 다양한 스토리지 프로바이더(S3, R2, GCS 등)를 추상화
 */
export interface IStorageService {
	/**
	 * 단일 이미지 업로드
	 * @param folder 폴더 경로
	 * @param image 업로드할 이미지 파일
	 * @returns 업로드된 이미지 정보 (url 포함)
	 */
	uploadImage(
		folder: string,
		image: Express.Multer.File
	): Promise<Omit<Express.Multer.File, "buffer"> & { url: string }>

	/**
	 * 다중 이미지 업로드
	 * @param folder 폴더 경로
	 * @param images 업로드할 이미지 파일 배열
	 * @returns 업로드된 이미지 정보 배열 (url 포함)
	 */
	uploadImages(
		folder: string,
		images: Array<Express.Multer.File>
	): Promise<(Omit<Express.Multer.File, "buffer"> & { url: string })[]>

	/**
	 * 이미지 삭제
	 * @param folder 폴더 경로
	 * @param image 삭제할 이미지 정보
	 */
	deleteImage(folder: string, image: FolderImage): Promise<void>
}
