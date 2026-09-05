import assert from "node:assert/strict";
import type { Server } from "node:http";
import test from "node:test";
import express from "express";
import { type CocoSourceDataset, cocoDatasetSectionsSchema } from "../src/logic/cocoExporter.js";

const completeSourceDataset: CocoSourceDataset = {
  images: [
    {
      id: 101,
      width: 800,
      height: 600,
      filename: "first.jpg",
    },
    {
      id: 102,
      width: 640,
      height: 480,
      filename: "second.png",
    },
  ],
  annotations: [
    {
      id: 501,
      imageId: 101,
      categoryId: 7,
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    },
    {
      id: 502,
      imageId: 102,
      categoryId: 8,
      x: 50,
      y: 60,
      width: 70,
      height: 80,
    },
  ],
  categories: [
    {
      id: 7,
      name: "persona",
    },
    {
      id: 8,
      name: "vehículo",
    },
  ],
};

async function listen(app: express.Express): Promise<{ server: Server; url: string }> {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();

      assert.ok(address && typeof address === "object");
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function loadCreateExportRoutes() {
  process.env.MARIADB_HOST ??= "127.0.0.1";
  process.env.MARIADB_DATABASE ??= "mlops_test";
  process.env.MARIADB_USER ??= "test";
  process.env.MARIADB_PASSWORD ??= "test";
  process.env.MINIO_ENDPOINT ??= "127.0.0.1";
  process.env.MINIO_USE_SSL ??= "false";
  process.env.MINIO_ACCESS_KEY ??= "test";
  process.env.MINIO_SECRET_KEY ??= "test";
  process.env.MINIO_BUCKET_NAME ??= "test-images";

  const { createExportRoutes } = await import("../src/presentation/exportRoutes.js");
  return createExportRoutes;
}

test("F6-04 endpoint downloads complete COCO JSON with attachment headers", async () => {
  const app = express();
  const createExportRoutes = await loadCreateExportRoutes();

  app.use(
    "/export",
    createExportRoutes({
      async getSourceDataset() {
        return completeSourceDataset;
      },
    }),
  );
  const { server, url } = await listen(app);

  try {
    const response = await fetch(`${url}/export/coco`);
    const body = await response.json();
    const dataset = cocoDatasetSectionsSchema.parse(body);

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/);
    assert.equal(
      response.headers.get("content-disposition"),
      'attachment; filename="coco-dataset.json"',
    );
    assert.equal(dataset.images.length, 2);
    assert.equal(dataset.annotations.length, 2);
    assert.equal(dataset.categories.length, 2);
    assert.deepEqual(
      dataset.annotations.map((annotation) => annotation.image_id),
      [101, 102],
    );
  } finally {
    await close(server);
  }
});

test("F6-04 export route is mounted by the application entrypoint", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile("src/index.ts", "utf8"));

  assert.match(source, /import \{ exportRoutes \}/);
  assert.match(source, /app\.use\("\/export", exportRoutes\)/);
});
