import assert from "node:assert/strict";
import test from "node:test";

type SourceImage = {
  id: number;
  width: number;
  height: number;
  fileName: string;
};

type SourceCategory = {
  id: number;
  name: string;
};

type SourceAnnotation = {
  id: number;
  imageId: number;
  categoryId: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type CocoImage = {
  id: number;
  width: number;
  height: number;
  file_name: string;
};

type CocoCategory = {
  id: number;
  name: string;
};

type CocoAnnotation = {
  id: number;
  image_id: number;
  category_id: number;
  bbox: [number, number, number, number];
  area: number;
  iscrowd: number;
};

type CocoDataset = {
  images: CocoImage[];
  annotations: CocoAnnotation[];
  categories: CocoCategory[];
};

type CocoFixture = {
  images: SourceImage[];
  annotations: SourceAnnotation[];
  categories: SourceCategory[];
};

type CocoExporter = (fixture: CocoFixture) => string | CocoDataset;

const controlledFixture: CocoFixture = {
  images: [
    {
      id: 101,
      width: 800,
      height: 600,
      fileName: "controlled-800x600.jpg",
    },
  ],
  categories: [
    {
      id: 7,
      name: "persona",
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
  ],
};

async function loadExporter(): Promise<CocoExporter> {
  try {
    const module = (await import("../src/logic/cocoExporter.js")) as {
      exportCocoDataset?: CocoExporter;
    };

    assert.equal(
      typeof module.exportCocoDataset,
      "function",
      "F6-01 RED: exportCocoDataset must be implemented in F6-02/F6-03.",
    );

    return module.exportCocoDataset;
  } catch (error) {
    assert.fail(
      `F6-01 RED: COCO exporter is intentionally missing until F6-02/F6-03. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function exportControlledDataset(): Promise<CocoDataset> {
  const exportCocoDataset = await loadExporter();
  const exported = exportCocoDataset(controlledFixture);
  const dataset = typeof exported === "string" ? JSON.parse(exported) : exported;

  return dataset as CocoDataset;
}

function assertUniqueIds(collectionName: string, values: Array<{ id: number }>): void {
  const ids = values.map((value) => value.id);
  const uniqueIds = new Set(ids);

  assert.equal(uniqueIds.size, ids.length, `${collectionName} must have unique ids.`);
}

function assertCocoSectionsAndIds(dataset: CocoDataset): void {
  assert.ok(Array.isArray(dataset.images), "COCO dataset must include images[].");
  assert.ok(Array.isArray(dataset.annotations), "COCO dataset must include annotations[].");
  assert.ok(Array.isArray(dataset.categories), "COCO dataset must include categories[].");

  assertUniqueIds("images", dataset.images);
  assertUniqueIds("annotations", dataset.annotations);
  assertUniqueIds("categories", dataset.categories);

  const imageIds = new Set(dataset.images.map((image) => image.id));
  const categoryIds = new Set(dataset.categories.map((category) => category.id));

  for (const annotation of dataset.annotations) {
    assert.ok(
      imageIds.has(annotation.image_id),
      `annotation ${annotation.id} references missing image_id ${annotation.image_id}.`,
    );
    assert.ok(
      categoryIds.has(annotation.category_id),
      `annotation ${annotation.id} references missing category_id ${annotation.category_id}.`,
    );
  }
}

function assertCocoGeometryContract(dataset: CocoDataset): void {
  assertCocoSectionsAndIds(dataset);

  for (const annotation of dataset.annotations) {
    assert.deepEqual(
      annotation.bbox,
      [10, 20, 30, 40],
      "bbox must be [x, y, width, height] in original image pixels.",
    );
    assert.notDeepEqual(annotation.bbox, [10, 20, 40, 60], "bbox must not be [x1, y1, x2, y2].");
    assert.ok(
      annotation.bbox.some((value) => value > 1),
      "bbox must not be normalized to the 0-1 range.",
    );
    assert.ok(
      Math.abs(annotation.area - annotation.bbox[2] * annotation.bbox[3]) < 0.000001,
      "area must be width * height.",
    );
    assert.ok(
      annotation.iscrowd === 0 || annotation.iscrowd === 1,
      "iscrowd must be present as 0 or 1.",
    );
  }
}

test("F6-01 RED: exports parseable COCO JSON with images, annotations, and categories", async () => {
  const dataset = await exportControlledDataset();

  assertCocoSectionsAndIds(dataset);
});

test("F6-01 RED: annotation references point to existing images and categories", async () => {
  const dataset = await exportControlledDataset();
  const annotation = dataset.annotations[0];

  assert.equal(annotation.image_id, 101);
  assert.equal(annotation.category_id, 7);
  assertCocoSectionsAndIds(dataset);
});

test("F6-01 RED: ids are unique inside images, annotations, and categories", async () => {
  const dataset = await exportControlledDataset();

  assertCocoSectionsAndIds(dataset);
});

test("F6-01 RED: bbox is absolute [x, y, width, height], not normalized or xyxy", async () => {
  const dataset = await exportControlledDataset();
  const annotation = dataset.annotations[0];

  assert.deepEqual(annotation.bbox, [10, 20, 30, 40]);
  assert.notDeepEqual(annotation.bbox, [10, 20, 40, 60]);
  assert.ok(annotation.bbox.some((value) => value > 1));
});

test("F6-01 RED: area is width times height and iscrowd is valid", async () => {
  const dataset = await exportControlledDataset();
  const annotation = dataset.annotations[0];

  assert.equal(annotation.area, 1200);
  assert.ok(annotation.iscrowd === 0 || annotation.iscrowd === 1);
});

test("F6-01 mutation guard rejects xyxy bbox semantics", () => {
  const mutatedDataset: CocoDataset = {
    images: [{ id: 101, width: 800, height: 600, file_name: "controlled-800x600.jpg" }],
    categories: [{ id: 7, name: "persona" }],
    annotations: [
      {
        id: 501,
        image_id: 101,
        category_id: 7,
        bbox: [10, 20, 40, 60],
        area: 1200,
        iscrowd: 0,
      },
    ],
  };

  assert.throws(() => assertCocoGeometryContract(mutatedDataset), /width, height/);
});
