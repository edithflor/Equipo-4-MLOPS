import { sql } from "drizzle-orm";
import { Client } from "minio";
import { env } from "../config/env.js";
import { db, poolConnection } from "./db.js";
import { categories, images } from "./schema.js";

const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_API_PORT,
  useSSL: false,
  accessKey: env.MINIO_ROOT_USER,
  secretKey: env.MINIO_ROOT_PASSWORD,
});

export async function runSeeder() {
  console.log("🌱 Ejecutando seeder idempotente...");

  await db
    .insert(categories)
    .values([
      { id: 1, name: "persona", color: "#e74c3c" },
      { id: 2, name: "vehiculo", color: "#3498db" },
    ])
    .onDuplicateKeyUpdate({ set: { id: sql`id` } });

  const bucket = env.MINIO_BUCKET_IMAGES;
  const bucketExists = await minioClient.bucketExists(bucket);
  if (!bucketExists) {
    await minioClient.makeBucket(bucket, "us-east-1");
  }

  const dummyBuffer = Buffer.from("dummy-image-content");

  const mockImages = [
    { id: 1, objectKey: "seed-img-1.jpg", mime: "image/jpeg", width: 800, height: 600 },
    { id: 2, objectKey: "seed-img-2.jpg", mime: "image/jpeg", width: 1024, height: 768 },
  ];

  for (const img of mockImages) {
    try {
      await minioClient.statObject(bucket, img.objectKey);
    } catch (e) {
      await minioClient.putObject(bucket, img.objectKey, dummyBuffer, dummyBuffer.length, {
        "Content-Type": img.mime,
      });
    }
  }

  await db
    .insert(images)
    .values(mockImages)
    .onDuplicateKeyUpdate({ set: { id: sql`id` } });

  console.log("✅ Seeder finalizado (2 categorías, 2 imágenes).");
}

if (process.argv[1].endsWith("seed.ts")) {
  runSeeder()
    .catch(console.error)
    .finally(() => poolConnection.end());
}
