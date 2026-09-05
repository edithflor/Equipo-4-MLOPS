import assert from "node:assert/strict";
import test from "node:test";
import {
  type CocoSourceDataset,
  cocoDatasetSectionsSchema,
  exportCocoDataset,
} from "../src/logic/cocoExporter.js";

const normalDataset: CocoSourceDataset = {
  images: [
    {
      id: 101,
      width: 800,
      height: 600,
      filename: "controlled-800x600.jpg",
    },
    {
      id: 102,
      width: 640,
      height: 480,
      fileName: "second-image.png",
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
};

test("F6-02 exports images, annotations, and categories sections", () => {
  const dataset = exportCocoDataset(normalDataset);

  assert.deepEqual(Object.keys(dataset).sort(), ["annotations", "categories", "images"]);
  assert.equal(dataset.images.length, 2);
  assert.equal(dataset.annotations.length, 2);
  assert.equal(dataset.categories.length, 2);
});

test("F6-02 keeps known image ids, dimensions, and file_name", () => {
  const dataset = exportCocoDataset(normalDataset);

  assert.deepEqual(dataset.images[0], {
    id: 101,
    width: 800,
    height: 600,
    file_name: "controlled-800x600.jpg",
  });
  assert.equal(dataset.images[1].file_name, "second-image.png");
});

test("F6-02 keeps real category ids and names", () => {
  const dataset = exportCocoDataset(normalDataset);

  assert.deepEqual(dataset.categories, [
    { id: 7, name: "persona" },
    { id: 8, name: "vehículo" },
  ]);
});

test("F6-02 annotations reference existing image and category ids", () => {
  const dataset = exportCocoDataset(normalDataset);
  const imageIds = new Set(dataset.images.map((image) => image.id));
  const categoryIds = new Set(dataset.categories.map((category) => category.id));

  for (const annotation of dataset.annotations) {
    assert.ok(imageIds.has(annotation.image_id));
    assert.ok(categoryIds.has(annotation.category_id));
  }
});

test("F6-02 validates output with the Zod COCO sections schema", () => {
  const dataset = exportCocoDataset(normalDataset);

  assert.doesNotThrow(() => cocoDatasetSectionsSchema.parse(dataset));
});

test("F6-02 rejects orphan annotation references", () => {
  assert.throws(
    () =>
      exportCocoDataset({
        ...normalDataset,
        annotations: [
          {
            id: 999,
            imageId: 999,
            categoryId: 7,
            x: 10,
            y: 20,
            width: 30,
            height: 40,
          },
        ],
      }),
    /missing image_id/,
  );
});

test("F6-02 rejects duplicate ids inside a COCO section", () => {
  assert.throws(
    () =>
      exportCocoDataset({
        ...normalDataset,
        images: [
          normalDataset.images[0],
          {
            ...normalDataset.images[1],
            id: normalDataset.images[0].id,
          },
        ],
      }),
    /duplicate id/,
  );
});

test("F6-02 exports an empty dataset without throwing", () => {
  const dataset = exportCocoDataset({
    images: [],
    annotations: [],
    categories: [],
  });

  assert.deepEqual(dataset, {
    images: [],
    annotations: [],
    categories: [],
  });
});

test("F6-02 data layer can read persisted PNG and JPEG dimensions for COCO images", async () => {
  process.env.MARIADB_HOST ??= "127.0.0.1";
  process.env.MARIADB_DATABASE ??= "mlops_test";
  process.env.MARIADB_USER ??= "test";
  process.env.MARIADB_PASSWORD ??= "test";
  process.env.MINIO_ENDPOINT ??= "127.0.0.1";
  process.env.MINIO_USE_SSL ??= "false";
  process.env.MINIO_ACCESS_KEY ??= "test";
  process.env.MINIO_SECRET_KEY ??= "test";
  process.env.MINIO_BUCKET_NAME ??= "test-images";

  const { readImageDimensions } = await import("../src/data/cocoExportRepository.js");
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x03, 0x20, 0x00, 0x00, 0x02, 0x58,
  ]);
  const jpegWithStartOfFrame = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x58, 0x03, 0x20,
  ]);

  assert.deepEqual(readImageDimensions(pngHeader, "image/png"), { width: 800, height: 600 });
  assert.deepEqual(readImageDimensions(jpegWithStartOfFrame, "image/jpeg"), {
    width: 800,
    height: 600,
  });
});
