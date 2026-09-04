import { eq } from "drizzle-orm";
import { db } from "./db";
import { images } from "../db/schema";

export type NewImage = typeof images.$inferInsert;

export async function createImage(data: NewImage) {
  await db.insert(images).values(data);
  return data;
}

export async function findImageById(id: string) {
  const rows = await db
    .select()
    .from(images)
    .where(eq(images.id, id))
    .limit(1);

  return rows[0];
}

export async function listImages() {
  return db.select().from(images);
}
