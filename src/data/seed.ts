import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "./db.js";
import { buildImageContentPath, buildImageObjectName, putImageObject } from "./objectStorage.js";
import { bboxes, categories, images } from "./schema.js";

const seedImages = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    filename: "seed-img-1.jpg",
    mimetype: "image/jpeg",
    buffer: Buffer.from(
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAACAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDyyiiiv0A/Aj//2Q==",
      "base64",
    ),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    filename: "seed-img-2.png",
    mimetype: "image/png",
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
      await putImageObject({
        objectName: buildImageObjectName(image),
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
          url: buildImageContentPath(image.id),
        })),
      )
      .onDuplicateKeyUpdate({
        set: {
          size: sql`values(size)`,
          url: sql`values(url)`,
        },
      });
    console.log("Imágenes de ejemplo verificadas.");

    await db
      .insert(bboxes)
      .values([
        {
          id: "33333333-3333-4333-8333-333333333333",
          imageId: seedImages[0].id,
          categoryId: 1,
          x: 0.2,
          y: 0.2,
          width: 1,
          height: 1,
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          imageId: seedImages[1].id,
          categoryId: 2,
          x: 0.1,
          y: 0.1,
          width: 0.8,
          height: 0.8,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          x: sql`values(x)`,
          y: sql`values(y)`,
          width: sql`values(width)`,
          height: sql`values(height)`,
        },
      });
    console.log("Bounding boxes de ejemplo verificadas.");

    console.log("Seeder ejecutado con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  }
}

seed();
