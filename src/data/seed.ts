import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "../data/db";
import { categories, images } from "./schema";
import {
  BUCKET_NAME,
  ensureBucketExists,
  minioClient,
} from "../lib/minio";

const CATEGORY_DATA = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "persona",
    colorHex: "#4CAF50",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "auto",
    colorHex: "#2196F3",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "bicicleta",
    colorHex: "#FF9800",
  },
];

const IMAGE_DATA = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    filename: "seed-001.png",
    objectKey: "seed/seed-001.png",
    width: 1,
    height: 1,
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    filename: "seed-002.png",
    objectKey: "seed/seed-002.png",
    width: 1,
    height: 1,
  },
];

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

async function seed(): Promise<void> {
  await ensureBucketExists();

  for (const category of CATEGORY_DATA) {
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.id, category.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(categories).values(category);
    }
  }

  for (const image of IMAGE_DATA) {
    const existing = await db
      .select()
      .from(images)
      .where(eq(images.id, image.id))
      .limit(1);

    if (existing.length === 0) {
      const existsInMinio = await objectExists(
        BUCKET_NAME,
        image.objectKey,
      );

      if (!existsInMinio) {
        await minioClient.putObject(
          BUCKET_NAME,
          image.objectKey,
          ONE_PIXEL_PNG,
          ONE_PIXEL_PNG.length,
          {
            "Content-Type": "image/png",
          },
        );
      }

      await db.insert(images).values({
        id: image.id,
        filename: image.filename,
        mimeType: "image/png",
        sizeBytes: ONE_PIXEL_PNG.length,
        minioBucket: BUCKET_NAME,
        minioObjectKey: image.objectKey,
        width: image.width,
        height: image.height,
        status: "ready",
      });
    }
  }

  console.log("Seeder ejecutado correctamente.");
}

async function objectExists(
  bucket: string,
  objectKey: string,
): Promise<boolean> {
  try {
    await minioClient.statObject(bucket, objectKey);
    return true;
  } catch {
    return false;
  }
}

seed().catch((error) => {
  console.error("Error ejecutando seed:", error);
  process.exit(1);
});
