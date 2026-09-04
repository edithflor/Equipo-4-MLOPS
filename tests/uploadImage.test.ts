import assert from "node:assert";
import test from "node:test";
import "dotenv/config";
import { UploadValidationService } from "../src/logic/uploadValidation.js";

const service = new UploadValidationService();

test("acepta JPEG válido", () => {
  const result = service.validate({
    filename: "test.jpg",
    mimetype: "image/jpeg",
    size: 1024,
    buffer: Buffer.from("fake-image-data"),
  });
  assert.strictEqual(result.success, true);
});

test("acepta PNG válido", () => {
  const result = service.validate({
    filename: "test.png",
    mimetype: "image/png",
    size: 1024,
    buffer: Buffer.from("fake-image-data"),
  });
  assert.strictEqual(result.success, true);
});

test("rechaza MIME no permitido", () => {
  const result = service.validate({
    filename: "test.txt",
    mimetype: "text/plain",
    size: 1024,
    buffer: Buffer.from("fake-text"),
  });
  assert.strictEqual(result.success, false);
  assert.match(result.error || "", /mime|permitido/i);
});

test("rechaza archivo demasiado grande", () => {
  const result = service.validate({
    filename: "test.jpg",
    mimetype: "image/jpeg",
    size: 100000000,
    buffer: Buffer.from("fake-image-data"),
  });
  assert.strictEqual(result.success, false);
  assert.match(result.error || "", /tamaño|excede/i);
});

test("rechaza width inválido o ausente en el payload", () => {
  const result = service.validate({
    filename: "test.jpg",
    mimetype: "image/jpeg",
    size: 1024,
  });
  assert.strictEqual(result.success, false);
});
