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

  // URLs de imágenes reales y estables de prueba (acordes a MLOps / objetos)
  const mockImagesToFetch = [
    { 
      id: 1, 
      objectKey: "seed-img-1.jpg", 
      mime: "image/jpeg", 
      width: 640, 
      height: 480, 
      url: "https://picsum.photos/id/64/640/480" // Foto de ejemplo (persona/entorno)
    },
    { 
      id: 2, 
      objectKey: "seed-img-2.jpg", 
      mime: "image/jpeg", 
      width: 640, 
      height: 480, 
      url: "https://picsum.photos/id/111/640/480" // Foto de ejemplo (vehículo/objeto)
    },
  ];

  for (const img of mockImagesToFetch) {
    try {
      await minioClient.statObject(bucket, img.objectKey);
    } catch (e) {
      // Descargamos la imagen real de internet en tiempo de ejecución
      console.log(`📥 Descargando imagen de prueba para ${img.objectKey}...`);
      const response = await fetch(img.url);
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      await minioClient.putObject(bucket, img.objectKey, imageBuffer, imageBuffer.length, {
        "Content-Type": img.mime,
      });
    }
  }

  await db
    .insert(images)
    .values(
      mockImagesToFetch.map(({ id, objectKey, mime, width, height }) => ({
        id,
        objectKey,
        mime,
        width,
        height,
      }))
    )
    .onDuplicateKeyUpdate({ set: { id: sql`id` } });

  console.log("✅ Seeder finalizado (2 categorías, 2 imágenes reales y visibles).");
}

if (process.argv[1].endsWith("seed.ts")) {
  runSeeder()
    .catch((error) => {
      console.error("❌ Error en el seeder:", error);
      process.exit(1);
    })
    .finally(() => poolConnection.end());
}
