import { Client } from "minio";
import { env } from "../config/env.js";
import { db } from "./db.js";
import { annotations, images } from "./schema.js";

const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_API_PORT,
  useSSL: false,
  accessKey: env.MINIO_ROOT_USER,
  secretKey: env.MINIO_ROOT_PASSWORD,
});

export async function saveImage(
  filename: string,
  buffer: Buffer,
  mimeType: string,
  width: number,
  height: number,
) {
  const bucket = env.MINIO_BUCKET_IMAGES;

  const bucketExists = await minioClient.bucketExists(bucket);
  if (!bucketExists) {
    await minioClient.makeBucket(bucket, "us-east-1");
  }

  const objectKey = `${Date.now()}-${filename}`;

  await minioClient.putObject(bucket, objectKey, buffer, buffer.length, {
    "Content-Type": mimeType,
  });

  const [insertResult] = await db.insert(images).values({
    objectKey,
    mime: mimeType,
    width,
    height,
  });

  return { objectKey, insertId: insertResult.insertId };
}

export async function insertAnnotation(data: {
  imageId: number;
  categoryId: number;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const [result] = await db.insert(annotations).values(data);
  return result.insertId;
}
