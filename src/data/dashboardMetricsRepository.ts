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
    const [
      imageRows,
      annotationRows,
      categoryRows,
      annotatedRows,
      pendingRows,
      objectsByCategoryRows,
    ] = await Promise.all([
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
      this.database
        .select({
          categoryId: categories.id,
          categoryName: categories.name,
          categoryColor: categories.color,
          count: count(bboxes.id),
        })
        .from(bboxes)
        .innerJoin(categories, eq(bboxes.categoryId, categories.id))
        .groupBy(categories.id, categories.name, categories.color),
    ]);

    const totalImages = readCount(imageRows);
    const annotatedImages = readCount(annotatedRows);
    const pendingImages = readCount(pendingRows);

    return {
      totalImages,
      totalAnnotations: readCount(annotationRows),
      totalCategories: readCount(categoryRows),
      annotatedImages,
      pendingImages,
      objectsByCategory: objectsByCategoryRows,
      annotationProgress: {
        annotated: annotatedImages,
        pending: pendingImages,
        totalImages,
      },
    };
  }
}
