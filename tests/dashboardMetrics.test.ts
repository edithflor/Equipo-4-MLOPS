import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  type DashboardMetrics,
  type DashboardMetricsReader,
  DashboardMetricsSchema,
  DashboardMetricsService,
} from "../src/logic/dashboardMetrics.js";

class MutableMetricsReader implements DashboardMetricsReader {
  public constructor(private metrics: DashboardMetrics) {}

  public setMetrics(metrics: DashboardMetrics): void {
    this.metrics = metrics;
  }

  public async getMetrics(): Promise<DashboardMetrics> {
    return this.metrics;
  }
}

const projectRoot = process.cwd();

test("dashboard metrics response schema exposes required real counters", () => {
  const result = DashboardMetricsSchema.safeParse({
    totalImages: 2,
    totalAnnotations: 2,
    totalCategories: 3,
    annotatedImages: 2,
    pendingImages: 0,
    objectsByCategory: [
      {
        categoryId: 1,
        categoryName: "persona",
        categoryColor: "#e74c3c",
        count: 1,
      },
      {
        categoryId: 2,
        categoryName: "vehículo",
        categoryColor: "#3498db",
        count: 1,
      },
    ],
    annotationProgress: {
      annotated: 2,
      pending: 0,
      totalImages: 2,
    },
  });

  assert.equal(result.success, true);
});

test("dashboard metrics schema rejects missing annotated vs pending counters", () => {
  const result = DashboardMetricsSchema.safeParse({
    totalImages: 2,
    totalAnnotations: 2,
    totalCategories: 3,
  });

  assert.equal(result.success, false);
});

test("dashboard metrics service returns changed repository values without caching constants", async () => {
  const reader = new MutableMetricsReader({
    totalImages: 2,
    totalAnnotations: 2,
    totalCategories: 3,
    annotatedImages: 1,
    pendingImages: 1,
    objectsByCategory: [
      {
        categoryId: 1,
        categoryName: "persona",
        categoryColor: "#e74c3c",
        count: 1,
      },
    ],
    annotationProgress: {
      annotated: 1,
      pending: 1,
      totalImages: 2,
    },
  });
  const service = new DashboardMetricsService(reader);

  assert.deepEqual(await service.getMetrics(), {
    totalImages: 2,
    totalAnnotations: 2,
    totalCategories: 3,
    annotatedImages: 1,
    pendingImages: 1,
    objectsByCategory: [
      {
        categoryId: 1,
        categoryName: "persona",
        categoryColor: "#e74c3c",
        count: 1,
      },
    ],
    annotationProgress: {
      annotated: 1,
      pending: 1,
      totalImages: 2,
    },
  });

  reader.setMetrics({
    totalImages: 3,
    totalAnnotations: 4,
    totalCategories: 3,
    annotatedImages: 2,
    pendingImages: 1,
    objectsByCategory: [
      {
        categoryId: 1,
        categoryName: "persona",
        categoryColor: "#e74c3c",
        count: 3,
      },
      {
        categoryId: 2,
        categoryName: "vehículo",
        categoryColor: "#3498db",
        count: 1,
      },
    ],
    annotationProgress: {
      annotated: 2,
      pending: 1,
      totalImages: 3,
    },
  });

  assert.deepEqual(await service.getMetrics(), {
    totalImages: 3,
    totalAnnotations: 4,
    totalCategories: 3,
    annotatedImages: 2,
    pendingImages: 1,
    objectsByCategory: [
      {
        categoryId: 1,
        categoryName: "persona",
        categoryColor: "#e74c3c",
        count: 3,
      },
      {
        categoryId: 2,
        categoryName: "vehículo",
        categoryColor: "#3498db",
        count: 1,
      },
    ],
    annotationProgress: {
      annotated: 2,
      pending: 1,
      totalImages: 3,
    },
  });
});

test("dashboard chart series schema requires category count, name, and color", () => {
  const result = DashboardMetricsSchema.safeParse({
    totalImages: 3,
    totalAnnotations: 4,
    totalCategories: 3,
    annotatedImages: 2,
    pendingImages: 1,
    objectsByCategory: [
      {
        categoryId: 1,
        categoryName: "persona",
        categoryColor: "#e74c3c",
        count: 3,
      },
    ],
    annotationProgress: {
      annotated: 2,
      pending: 1,
      totalImages: 3,
    },
  });

  assert.equal(result.success, true);
  assert.equal(
    result.success
      ? result.data.annotationProgress.annotated + result.data.annotationProgress.pending
      : 0,
    result.success ? result.data.annotationProgress.totalImages : -1,
  );
});

test("dashboard metrics repository uses SQL count aggregations for each metric", async () => {
  const source = await readFile(
    join(projectRoot, "src", "data", "dashboardMetricsRepository.ts"),
    "utf8",
  );

  assert.match(source, /select\(\{ value: count\(\) \}\)\.from\(images\)/);
  assert.match(source, /select\(\{ value: count\(\) \}\)\.from\(bboxes\)/);
  assert.match(source, /select\(\{ value: count\(\) \}\)\.from\(categories\)/);
  assert.match(source, /countDistinct\(images\.id\)/);
  assert.match(source, /leftJoin\(bboxes, eq\(images\.id, bboxes\.imageId\)\)/);
  assert.match(source, /where\(isNull\(bboxes\.id\)\)/);
  assert.match(source, /count\(bboxes\.id\)/);
  assert.match(source, /\.from\(bboxes\)/);
  assert.match(source, /innerJoin\(categories, eq\(bboxes\.categoryId, categories\.id\)\)/);
  assert.match(source, /groupBy\(categories\.id, categories\.name, categories\.color\)/);
  assert.doesNotMatch(source, /\.length|\.filter\(|findMany|select\(\)\.from\(images\)/);
});

test("dashboard chart series mutation is reflected by the reusable metrics service", async () => {
  const reader = new MutableMetricsReader({
    totalImages: 3,
    totalAnnotations: 2,
    totalCategories: 3,
    annotatedImages: 2,
    pendingImages: 1,
    objectsByCategory: [
      {
        categoryId: 1,
        categoryName: "persona",
        categoryColor: "#e74c3c",
        count: 1,
      },
    ],
    annotationProgress: {
      annotated: 2,
      pending: 1,
      totalImages: 3,
    },
  });
  const service = new DashboardMetricsService(reader);

  reader.setMetrics({
    totalImages: 3,
    totalAnnotations: 3,
    totalCategories: 3,
    annotatedImages: 3,
    pendingImages: 0,
    objectsByCategory: [
      {
        categoryId: 1,
        categoryName: "persona",
        categoryColor: "#e74c3c",
        count: 2,
      },
    ],
    annotationProgress: {
      annotated: 3,
      pending: 0,
      totalImages: 3,
    },
  });

  const metrics = await service.getMetrics();

  assert.equal(metrics.objectsByCategory[0]?.count, 2);
  assert.equal(metrics.annotationProgress.annotated, 3);
  assert.equal(metrics.annotationProgress.pending, 0);
});

test("dashboard endpoint is mounted and served through the HTTP API", async () => {
  const indexSource = await readFile(join(projectRoot, "src", "index.ts"), "utf8");
  const routeSource = await readFile(
    join(projectRoot, "src", "presentation", "dashboardRoutes.ts"),
    "utf8",
  );

  assert.match(indexSource, /import \{ dashboardRoutes \}/);
  assert.match(indexSource, /app\.use\("\/dashboard", dashboardRoutes\)/);
  assert.match(routeSource, /dashboardRoutes\.get\("\/metrics"/);
  assert.match(routeSource, /metricsService\.getMetrics\(\)/);
});

test("dashboard UI consumes metrics endpoint and does not hardcode production totals", async () => {
  const html = await readFile(join(projectRoot, "public", "index.html"), "utf8");
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");
  const uiSource = `${html}\n${clientScript}`;

  assert.match(html, /id="dashboard-metrics"/);
  assert.match(html, /id="objects-by-category-chart"/);
  assert.match(html, /id="annotation-progress-chart"/);
  assert.match(clientScript, /fetch\("\/dashboard\/metrics"\)/);
  assert.match(clientScript, /metric\.dataset\.metricKey/);
  assert.match(clientScript, /payload\[key\]/);
  assert.match(clientScript, /renderObjectsByCategory\(payload\.objectsByCategory\)/);
  assert.match(clientScript, /renderAnnotationProgress\(payload\.annotationProgress\)/);
  assert.match(clientScript, /category\.categoryName/);
  assert.match(clientScript, /category\.categoryColor/);
  assert.doesNotMatch(uiSource, /mock|fixture|hardcoded/i);
  assert.doesNotMatch(uiSource, /totalImages:\s*\d|totalAnnotations:\s*\d|totalCategories:\s*\d/);
  assert.doesNotMatch(uiSource, /annotatedImages:\s*\d|pendingImages:\s*\d/);
});

test("dashboard UI files do not import database or object storage drivers", async () => {
  const html = await readFile(join(projectRoot, "public", "index.html"), "utf8");
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");
  const styles = await readFile(join(projectRoot, "public", "styles.css"), "utf8");
  const publicSource = `${html}\n${clientScript}\n${styles}`;

  assert.doesNotMatch(publicSource, /drizzle/i);
  assert.doesNotMatch(publicSource, /mysql/i);
  assert.doesNotMatch(publicSource, /mariadb/i);
  assert.doesNotMatch(publicSource, /minio/i);
});
