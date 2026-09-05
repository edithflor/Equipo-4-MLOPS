import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "./db.js";
import { buildObjectUrl, putImageObjectIfMissing } from "./objectStorage.js";
import { bboxes, categories, images } from "./schema.js";

const seedImages = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    filename: "seed-img-1.jpg",
    mimetype: "image/jpeg",
    objectName: "seed-img-1.jpg",
    buffer: Buffer.from(
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z",
      "base64",
    ),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    filename: "seed-img-2.png",
    mimetype: "image/png",
    objectName: "seed-img-2.png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64",
    ),
  },
];

async function seed() {
  try {
    console.log("Iniciando seeder...");

    await db
      .insert(categories)
      .values([
        { id: 1, name: "persona", color: "#e74c3c" },
        { id: 2, name: "vehículo", color: "#3498db" },
        { id: 3, name: "animal", color: "#2ecc71" },
      ])
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    console.log("Categorías de ejemplo verificadas.");

    for (const image of seedImages) {
      await putImageObjectIfMissing({
        objectName: image.objectName,
        buffer: image.buffer,
        mimetype: image.mimetype,
      });
    }

    await db
      .insert(images)
      .values(
        seedImages.map((image) => ({
          id: image.id,
          filename: image.filename,
          mimetype: image.mimetype,
          size: image.buffer.length,
          url: buildObjectUrl(image.objectName),
        })),
      )
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    console.log("Imágenes de ejemplo verificadas.");

    await db
      .insert(bboxes)
      .values([
        {
          id: "33333333-3333-4333-8333-333333333333",
          imageId: seedImages[0].id,
          categoryId: 1,
          x: 10,
          y: 10,
          width: 100,
          height: 100,
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          imageId: seedImages[1].id,
          categoryId: 2,
          x: 50,
          y: 50,
          width: 200,
          height: 150,
        },
      ])
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    console.log("Bounding boxes de ejemplo verificadas.");

    console.log("Seeder ejecutado con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  }
}

seed();
