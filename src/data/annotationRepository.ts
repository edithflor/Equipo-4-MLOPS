import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import type { BoundingBoxInput } from "../logic/bboxService.js";
import { db } from "./db.js";
import { bboxes } from "./schema.js";

export class AnnotationRepository {
  public async getByImageId(imageId: string): Promise<BoundingBoxInput[]> {
    const records = await db.select().from(bboxes).where(eq(bboxes.imageId, imageId));
    return records as BoundingBoxInput[];
  }

  public async save(box: BoundingBoxInput): Promise<void> {
    await db.insert(bboxes).values({
      id: box.id ?? crypto.randomUUID(),
      imageId: box.imageId,
      categoryId: box.categoryId,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    });
  }

  public async updateGeometry(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<void> {
    await db.update(bboxes).set({ x, y, width, height }).where(eq(bboxes.id, id));
  }

  public async delete(id: string): Promise<void> {
    await db.delete(bboxes).where(eq(bboxes.id, id));
  }
}
