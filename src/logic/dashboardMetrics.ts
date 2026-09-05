import { z } from "zod";

export const DashboardMetricsSchema = z.object({
  totalImages: z.number().int().nonnegative(),
  totalAnnotations: z.number().int().nonnegative(),
  totalCategories: z.number().int().nonnegative(),
  annotatedImages: z.number().int().nonnegative(),
  pendingImages: z.number().int().nonnegative(),
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
