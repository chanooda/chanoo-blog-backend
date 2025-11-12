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
 * AWS S3 스토리지 서비스 구현
 */
@Injectable()
export class S3StorageService implements IStorageService {
	private readonly s3Client: S3Client
	private readonly bucketName: string
	private readonly region: string

	constructor() {
		this.region = process.env.AWS_S3_REGION || "ap-northeast-2"
		this.bucketName = process.env.AWS_S3_BUCKET_NAME || ""

		if (!this.bucketName) {
			throw new Error("AWS_S3_BUCKET_NAME environment variable is required")
		}

		this.s3Client = new S3Client({
			region: this.region,
			credentials: {
				accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "",
				secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "",
			},
		})
	}

	private buildUrl(key: string): string {
		return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`
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
			const url = this.buildUrl(key)

			return {
				url: encodeURI(url),
				...restImage,
			}
		} catch (error) {
			throw new Error(`Failed to upload image to S3: ${error}`)
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
				const url = this.buildUrl(key)

				return {
					url: encodeURI(url),
					...restImage,
				}
			})
		} catch (error) {
			throw new Error(`Failed to upload images to S3: ${error}`)
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
			throw new Error(`Failed to delete image from S3: ${error}`)
		}
	}
}
