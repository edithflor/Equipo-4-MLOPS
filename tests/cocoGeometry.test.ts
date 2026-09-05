import assert from "node:assert/strict";
import test from "node:test";
import { cocoDatasetSectionsSchema, exportCocoDataset } from "../src/logic/cocoExporter.js";

const sourceDataset = {
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

test("F6-03 exports bbox as absolute [x, y, width, height]", () => {
  const dataset = exportCocoDataset(sourceDataset);
  const annotation = dataset.annotations[0];

  assert.deepEqual(annotation.bbox, [10, 20, 30, 40]);
  assert.notDeepEqual(annotation.bbox, [10, 20, 40, 60]);
  assert.ok(annotation.bbox.every((value) => value > 1));
});

test("F6-03 calculates area as width times height", () => {
  const dataset = exportCocoDataset(sourceDataset);
  const annotation = dataset.annotations[0];

  assert.equal(annotation.area, 1200);
  assert.equal(annotation.area, annotation.bbox[2] * annotation.bbox[3]);
});

test("F6-03 assigns iscrowd default 0", () => {
  const dataset = exportCocoDataset(sourceDataset);

  assert.equal(dataset.annotations[0].iscrowd, 0);
});

test("F6-03 mutation guard rejects xyxy bbox semantics", () => {
  const mutatedDataset = exportCocoDataset(sourceDataset);
  mutatedDataset.annotations[0].bbox = [10, 20, 40, 60];

  assert.notDeepEqual(mutatedDataset.annotations[0].bbox, [10, 20, 30, 40]);
});

test("F6-03 mutation guard rejects swapped width and height", () => {
  const mutatedDataset = exportCocoDataset(sourceDataset);
  mutatedDataset.annotations[0].bbox = [10, 20, 40, 30];

  assert.notEqual(mutatedDataset.annotations[0].bbox[2], sourceDataset.annotations[0].width);
  assert.notEqual(mutatedDataset.annotations[0].bbox[3], sourceDataset.annotations[0].height);
});

test("F6-03 mutation guard rejects normalized bbox", () => {
  const mutatedDataset = exportCocoDataset(sourceDataset);
  mutatedDataset.annotations[0].bbox = [0.0125, 0.0333333333, 0.0375, 0.0666666667];

  assert.ok(mutatedDataset.annotations[0].bbox.every((value) => value <= 1));
  assert.notDeepEqual(mutatedDataset.annotations[0].bbox, [10, 20, 30, 40]);
});

test("F6-03 Zod schema rejects missing iscrowd", () => {
  const dataset = exportCocoDataset(sourceDataset);
  const [{ iscrowd: _iscrowd, ...annotationWithoutIscrowd }] = dataset.annotations;

  assert.throws(
    () =>
      cocoDatasetSectionsSchema.parse({
        ...dataset,
        annotations: [annotationWithoutIscrowd],
      }),
    /iscrowd/,
  );
});

test("F6-03 mutation guard rejects area that is not width times height", () => {
  const dataset = exportCocoDataset(sourceDataset);
  dataset.annotations[0].area = 999;

  assert.throws(() => cocoDatasetSectionsSchema.parse(dataset), /area must be width \* height/);
});
