import { PutObjectCommand, PutObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';

import properties from '../properties';

type UploadParams = {
  bucket: string;
  key: string;
  body: Buffer;
  contentType?: string;
};

let s3Client: S3Client | undefined;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: properties.awsRegion,
      credentials: {
        accessKeyId: properties.awsAccessKeyId!,
        secretAccessKey: properties.awsSecretAccessKey!,
      },
    });
  }
  return s3Client;
}

export async function uploadToS3({
  bucket,
  key,
  body,
  contentType = 'application/octet-stream',
}: UploadParams): Promise<PutObjectCommandOutput> {
  return getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}
