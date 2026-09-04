import assert from "node:assert/strict";
import test from "node:test";
import { createBbox } from "../src/logic/bboxService";

const IMAGE_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const VALID_CATEGORY_ID =
  "11111111-1111-4111-8111-111111111111";

test("crear bbox con categoría válida está permitido", async () => {
  const annotation = await createBbox({
    imageId: IMAGE_ID,
    categoryId: VALID_CATEGORY_ID,
    x: 10,
    y: 20,
    width: 100,
    height: 80,
  });

  assert.ok(annotation);
  assert.equal(
    annotation.categoryId,
    VALID_CATEGORY_ID,
  );
});

test("bbox sin categoryId debe rechazarse", async () => {
  await assert.rejects(
    async () =>
      createBbox({
        imageId: IMAGE_ID,
        categoryId: undefined as never,
        x: 10,
        y: 20,
        width: 100,
        height: 80,
      }),
  );
});

test("bbox con categoryId null debe rechazarse", async () => {
  await assert.rejects(
    async () =>
      createBbox({
        imageId: IMAGE_ID,
        categoryId: null as never,
        x: 10,
        y: 20,
        width: 100,
        height: 80,
      }),
  );
});

test("bbox con categoría inexistente debe rechazarse", async () => {
  await assert.rejects(
    async () =>
      createBbox({
        imageId: IMAGE_ID,
        categoryId:
          "99999999-9999-4999-8999-999999999999",
        x: 10,
        y: 20,
        width: 100,
        height: 80,
      }),
  );
});