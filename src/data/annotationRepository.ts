import { eq } from "drizzle-orm";
import { db } from "./db";
import { annotations } from "../db/schema";

export type NewAnnotation = typeof annotations.$inferInsert;

export async function createAnnotation(data: NewAnnotation) {
  await db.insert(annotations).values(data);
  return data;
}

export async function findAnnotationById(id: string) {
  const rows = await db
    .select()
    .from(annotations)
    .where(eq(annotations.id, id))
    .limit(1);

  return rows[0];
}

export async function listAnnotationsByImage(imageId: string) {
  return db
    .select()
    .from(annotations)
    .where(eq(annotations.imageId, imageId));
}

export async function updateAnnotation(
  id: string,
  values: Partial<{
    x: number;
    y: number;
    width: number;
    height: number;
    area: number;
  }>,
) {
  await db
    .update(annotations)
    .set(values)
    .where(eq(annotations.id, id));
}

export async function removeAnnotation(id: string) {
  await db
    .delete(annotations)
    .where(eq(annotations.id, id));
}
