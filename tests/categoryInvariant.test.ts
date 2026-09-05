import assert from "node:assert";
import crypto from "node:crypto";
import test from "node:test";
import { BoundingBox, BoundingBoxSchema } from "../src/logic/bboxService.js";

test("crear bbox con categoría válida está permitido", () => {
  assert.doesNotThrow(() => {
    new BoundingBox({
      imageId: crypto.randomUUID(),
      categoryId: 1,
      x: 10,
      y: 10,
      width: 100,
      height: 100,
    });
  });
});

test("bbox sin categoryId debe rechazarse", () => {
  const result = BoundingBoxSchema.safeParse({
    imageId: crypto.randomUUID(),
    x: 10,
    y: 10,
    width: 100,
    height: 100,
  });
  assert.strictEqual(result.success, false);
  assert.match(result.error.issues[0].message, /categoría/i);
});

test("bbox con categoryId null debe rechazarse", () => {
  const result = BoundingBoxSchema.safeParse({
    imageId: crypto.randomUUID(),
    categoryId: null,
    x: 10,
    y: 10,
    width: 100,
    height: 100,
  });
  assert.strictEqual(result.success, false);
});

test("bbox con categoría inexistente debe rechazarse (Validación de tipo)", () => {
  const result = BoundingBoxSchema.safeParse({
    imageId: crypto.randomUUID(),
    categoryId: -5,
    x: 10,
    y: 10,
    width: 100,
    height: 100,
  });
  assert.strictEqual(result.success, false);
});
