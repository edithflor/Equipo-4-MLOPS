import { z } from "zod";

export const ObjectsByCategorySchema = z.object({
  categoryId: z.number().int().positive(),
  categoryName: z.string().min(1),
  categoryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  count: z.number().int().nonnegative(),
});

export const AnnotationProgressSchema = z.object({
  annotated: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  totalImages: z.number().int().nonnegative(),
});

export const DashboardMetricsSchema = z.object({
  totalImages: z.number().int().nonnegative(),
  totalAnnotations: z.number().int().nonnegative(),
  totalCategories: z.number().int().nonnegative(),
  annotatedImages: z.number().int().nonnegative(),
  pendingImages: z.number().int().nonnegative(),
  objectsByCategory: z.array(ObjectsByCategorySchema),
  annotationProgress: AnnotationProgressSchema,
});

export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;

export interface DashboardMetricsReader {
  getMetrics(): Promise<DashboardMetrics>;
}

export class DashboardMetricsService {
  public constructor(private readonly metricsReader: DashboardMetricsReader) {}

  public async getMetrics(): Promise<DashboardMetrics> {
    const metrics = await this.metricsReader.getMetrics();
    return DashboardMetricsSchema.parse(metrics);
  }
}
