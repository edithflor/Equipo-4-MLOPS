import crypto from "node:crypto";
import { ensureBucketExists } from "../lib/minio.js";
import { db } from "./db.js";
import { bboxes, categories, images } from "./schema.js";

async function seed() {
  try {
    console.log("Iniciando seeder...");

    await ensureBucketExists();

    await db.delete(bboxes);
    await db.delete(images);
    await db.delete(categories);

    console.log("Tablas limpiadas.");

    await db.insert(categories).values([
      { id: 1, name: "persona", color: "#e74c3c" },
      { id: 2, name: "vehículo", color: "#3498db" },
      { id: 3, name: "animal", color: "#2ecc71" },
    ]);
    console.log("Categorías insertadas.");

    const img1Id = crypto.randomUUID();
    const img2Id = crypto.randomUUID();

    await db.insert(images).values([
      {
        id: img1Id,
        filename: "test-1.jpg",
        mimetype: "image/jpeg",
        size: 102400,
        url: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${process.env.MINIO_BUCKET_NAME}/${img1Id}-test-1.jpg`,
      },
      {
        id: img2Id,
        filename: "test-2.png",
        mimetype: "image/png",
        size: 204800,
        url: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${process.env.MINIO_BUCKET_NAME}/${img2Id}-test-2.png`,
      },
    ]);
    console.log("Imágenes insertadas.");

    await db.insert(bboxes).values([
      {
        id: crypto.randomUUID(),
        imageId: img1Id,
        categoryId: 1,
        x: 10,
        y: 10,
        width: 100,
        height: 100,
      },
      {
        id: crypto.randomUUID(),
        imageId: img2Id,
        categoryId: 2,
        x: 50,
        y: 50,
        width: 200,
        height: 150,
      },
    ]);
    console.log("Bounding boxes insertadas.");

    console.log("Seeder ejecutado con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  }
}

seed();
