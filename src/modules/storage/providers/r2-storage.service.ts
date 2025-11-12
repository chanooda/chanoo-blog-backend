import {
	DeleteObjectCommand,
	type DeleteObjectRequest,
	PutObjectCommand,
	type PutObjectCommandInput,
	type PutObjectCommandOutput,
	S3Client,
} from "@aws-sdk/client-s3"
import { Injectable } from "@nestjs/common"
import { FolderImage } from "generated/prisma"
import { IStorageService } from "../storage.interface"

/**
 * Cloudflare R2 스토리지 서비스 구현
 * S3 호환 API를 사용하여 R2에 접근
 */
@Injectable()
export class R2StorageService implements IStorageService {
	private readonly s3Client: S3Client
	private readonly bucketName: string
	private readonly publicUrl: string

	constructor() {
		const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
		if (!accountId) {
			throw new Error("CLOUDFLARE_R2_ACCOUNT_ID environment variable is required")
		}

		this.s3Client = new S3Client({
			region: "auto",
			endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
				secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
			},
		})

		this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || ""
		this.publicUrl =
			process.env.CLOUDFLARE_R2_PUBLIC_URL ||
			process.env.CLOUDFLARE_R2_CUSTOM_DOMAIN ||
			""

		if (!this.bucketName) {
			throw new Error("CLOUDFLARE_R2_BUCKET_NAME environment variable is required")
		}

		if (!this.publicUrl) {
			throw new Error(
				"CLOUDFLARE_R2_PUBLIC_URL or CLOUDFLARE_R2_CUSTOM_DOMAIN environment variable is required"
			)
		}
	}

	async uploadImage(
		folder: string,
		image: Express.Multer.File
	): Promise<Omit<Express.Multer.File, "buffer"> & { url: string }> {
		try {
			const key = folder ? `${folder}/${image.originalname}` : image.originalname

			const params: PutObjectCommandInput = {
				Bucket: this.bucketName,
				Key: key,
				Body: image.buffer,
				ContentType: image.mimetype,
				ContentDisposition: "inline",
			}

			const command = new PutObjectCommand(params)
			await this.s3Client.send(command)

			const { buffer, ...restImage } = image
			const url = `${this.publicUrl}/${key}`

			return {
				url: encodeURI(url),
				...restImage,
			}
		} catch (error) {
			throw new Error(`Failed to upload image to R2: ${error}`)
		}
	}

	async uploadImages(
		folder: string,
		images: Array<Express.Multer.File>
	): Promise<(Omit<Express.Multer.File, "buffer"> & { url: string })[]> {
		const uploadPromises: Promise<PutObjectCommandOutput>[] = []
		const imageList = Array.from(images)

		imageList.forEach((image) => {
			const key = folder ? `${folder}/${image.originalname}` : image.originalname

			const params: PutObjectCommandInput = {
				Bucket: this.bucketName,
				Key: key,
				Body: image.buffer,
				ContentType: image.mimetype,
				ContentDisposition: "inline",
			}

			const command = new PutObjectCommand(params)
			uploadPromises.push(this.s3Client.send(command))
		})

		try {
			await Promise.all(uploadPromises)

			return imageList.map((image) => {
				const { buffer, ...restImage } = image
				const key = folder ? `${folder}/${image.originalname}` : image.originalname
				const url = `${this.publicUrl}/${key}`

				return {
					url: encodeURI(url),
					...restImage,
				}
			})
		} catch (error) {
			throw new Error(`Failed to upload images to R2: ${error}`)
		}
	}

	async deleteImage(folder: string, image: FolderImage): Promise<void> {
		const key = folder ? `${folder}/${image.originalname}` : image.originalname

		const params: DeleteObjectRequest = {
			Bucket: this.bucketName,
			Key: key,
		}

		const command = new DeleteObjectCommand(params)

		try {
			await this.s3Client.send(command)
		} catch (error) {
			throw new Error(`Failed to delete image from R2: ${error}`)
		}
	}
}
