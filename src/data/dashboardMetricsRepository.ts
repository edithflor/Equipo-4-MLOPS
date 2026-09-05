import { count, countDistinct, eq, isNull } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { DashboardMetrics } from "../logic/dashboardMetrics.js";
import { db } from "./db.js";
import { bboxes, categories, images } from "./schema.js";

function readCount(rows: { value: number }[]): number {
  return rows[0]?.value ?? 0;
}

export class DashboardMetricsRepository {
  public constructor(private readonly database: MySql2Database = db) {}

  public async getMetrics(): Promise<DashboardMetrics> {
    const [imageRows, annotationRows, categoryRows, annotatedRows, pendingRows] = await Promise.all(
      [
        this.database.select({ value: count() }).from(images),
        this.database.select({ value: count() }).from(bboxes),
        this.database.select({ value: count() }).from(categories),
        this.database
          .select({ value: countDistinct(images.id) })
          .from(images)
          .innerJoin(bboxes, eq(images.id, bboxes.imageId)),
        this.database
          .select({ value: count(images.id) })
          .from(images)
          .leftJoin(bboxes, eq(images.id, bboxes.imageId))
          .where(isNull(bboxes.id)),
      ],
    );

    return {
      totalImages: readCount(imageRows),
      totalAnnotations: readCount(annotationRows),
      totalCategories: readCount(categoryRows),
      annotatedImages: readCount(annotatedRows),
      pendingImages: readCount(pendingRows),
    };
  }
}
