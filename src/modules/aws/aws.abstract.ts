import { S3Client } from '@aws-sdk/client-s3';

export interface IAws {
  s3Client: S3Client;
  BUCKET_NAME: string;
  S3_BASE_URL: string;
  imagesUpload: (
    folder: string,
    images: Array<Express.Multer.File>,
  ) => Promise<(Omit<Express.Multer.File, 'buffer'> & { url: string })[]>;
}
