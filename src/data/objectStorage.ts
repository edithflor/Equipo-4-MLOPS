import * as Minio from "minio";
import { env } from "../config/env.js";

export const bucketName = env.MINIO_BUCKET_NAME;

export const objectStorageClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export function buildObjectUrl(objectName: string): string {
  const protocol = env.MINIO_USE_SSL ? "https" : "http";
  return `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${bucketName}/${objectName}`;
}

export function buildImageContentPath(imageId: string): string {
  return `/images/${imageId}/content`;
}

export function buildImageObjectName(data: { id: string; filename: string }): string {
  return `${data.id}-${data.filename}`;
}

export async function ensureBucketExists(): Promise<void> {
  const exists = await objectStorageClient.bucketExists(bucketName);

  if (!exists) {
    await objectStorageClient.makeBucket(bucketName, "us-east-1");
  }
}

export async function objectExists(objectName: string): Promise<boolean> {
  try {
    await objectStorageClient.statObject(bucketName, objectName);
    return true;
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : undefined;

    if (code === "NotFound" || code === "NoSuchKey") {
      return false;
    }

    throw error;
  }
}

export async function putImageObjectIfMissing(data: {
  objectName: string;
  buffer: Buffer;
  mimetype: string;
}): Promise<void> {
  await ensureBucketExists();

  if (await objectExists(data.objectName)) {
    return;
  }

  await putImageObject(data);
}

export async function putImageObject(data: {
  objectName: string;
  buffer: Buffer;
  mimetype: string;
}): Promise<void> {
  await ensureBucketExists();

  await objectStorageClient.putObject(
    bucketName,
    data.objectName,
    data.buffer,
    data.buffer.length,
    {
      "Content-Type": data.mimetype,
    },
  );
}

export async function getImageObject(objectName: string): Promise<NodeJS.ReadableStream> {
  return objectStorageClient.getObject(bucketName, objectName);
}
