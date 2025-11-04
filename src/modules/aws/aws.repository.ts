import {
	DeleteObjectCommand,
	type DeleteObjectRequest,
	PutObjectCommand,
	type PutObjectCommandInput,
	type PutObjectCommandOutput,
	S3Client,
} from "@aws-sdk/client-s3"
import { Injectable } from "@nestjs/common"
import type { FolderImage } from "generated/prisma"
import type { IAws } from "./aws.abstract"

@Injectable()
export class AwsRepository implements IAws {
	readonly s3Client = new S3Client({
		region: "ap-northeast-2",
		credentials: {
			accessKeyId: process.env.CHANOO_AWS_S3_ACCESS_KEY || "",
			secretAccessKey: process.env.CHANOO_AWS_S3_SECRET_ACCESS_KEY || "",
		},
	})
	readonly BUCKET_NAME = process.env.CHANOO_AWS_S3_BUCKET_NAME
	readonly S3_BASE_URL = process.env.CHANOO_AWS_S3_URL

	async imageUpload(folder: string, image: Express.Multer.File) {
		try {
			const params: PutObjectCommandInput = {
				Bucket: this.BUCKET_NAME,
				Key: folder ? `${folder}/${image.originalname}` : `/${image.originalname}`,
				Body: image.buffer,
				ContentType: image.mimetype,
				ContentDisposition: "inline",
			}
			const command = new PutObjectCommand(params)
			const awsResponse = await this.s3Client.send(command)

			console.log("aws PutObjectCommand list")
			console.log(awsResponse)

			const { buffer, ...restImage } = image

			return {
				url: encodeURI(
					`https://${this.BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com/${
						folder || ""
					}/${image.originalname}`
				),
				...restImage,
			}
		} catch (error) {
			throw new Error(error)
		}
	}

	async imagesUpload(folder: string, images: Array<Express.Multer.File>) {
		const promiseImageList: Promise<PutObjectCommandOutput>[] = []
		const imageList = Array.from(images)
		imageList.forEach((image) => {
			const params: PutObjectCommandInput = {
				Bucket: this.BUCKET_NAME,
				Key: folder ? `${folder}/${image.originalname}` : `/${image.originalname}`,
				Body: image.buffer,
				ContentType: image.mimetype,
				ContentDisposition: "inline",
			}
			const command = new PutObjectCommand(params)
			const imageUploadPromise = this.s3Client.send(command)
			promiseImageList.push(imageUploadPromise)
		})

		try {
			const awsResponse = await Promise.all(promiseImageList)

			console.log("aws PutObjectCommand list")
			console.log(awsResponse)

			const images = imageList?.map((image) => {
				const { buffer, ...restImage } = image
				return {
					url: encodeURI(
						`https://${this.BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com/${
							folder || ""
						}/${image.originalname}`
					),
					...restImage,
				}
			})

			return images
		} catch (error) {
			throw new Error(error)
		}
	}

	async imageDelete(folder: string, image: FolderImage) {
		const params: DeleteObjectRequest = {
			Bucket: this.BUCKET_NAME,
			Key: folder ? `${folder}/${image.originalname}` : `/${image.originalname}`,
		}

		const command = new DeleteObjectCommand(params)

		try {
			const awsResponse = await this.s3Client.send(command)
			return awsResponse
		} catch (error) {
			throw new Error(error)
		}
	}
}
