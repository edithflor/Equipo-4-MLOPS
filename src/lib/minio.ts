import * as Minio from "minio";
import { env } from "../config/env.js";

export const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export const BUCKET_NAME = env.MINIO_BUCKET_NAME;

// Función que el seeder necesita para garantizar que el bucket exista
export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`[MinIO] Bucket '${BUCKET_NAME}' creado exitosamente.`);
    } else {
      console.log(`[MinIO] Bucket '${BUCKET_NAME}' ya existe y está listo.`);
    }
  } catch (error) {
    console.error("[MinIO] Error verificando/creando el bucket:", error);
    throw error;
  }
}
