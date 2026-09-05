import assert from "node:assert";
import test from "node:test";
import "dotenv/config";
import { UploadValidationService } from "../src/logic/uploadValidation.js";

const service = new UploadValidationService({
  maxBytes: 5242880,
  mimeAllowlist: "image/jpeg,image/png",
});

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
    size: 5242881,
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

test("usa los límites configurados al construir el servicio", () => {
  const customService = new UploadValidationService({
    maxBytes: 4,
    mimeAllowlist: "image/webp",
  });

  const jpegResult = customService.validate({
    filename: "test.jpg",
    mimetype: "image/jpeg",
    size: 4,
    buffer: Buffer.from("data"),
  });

  const webpResult = customService.validate({
    filename: "test.webp",
    mimetype: "image/webp",
    size: 4,
    buffer: Buffer.from("data"),
  });

  const oversizedResult = customService.validate({
    filename: "test.webp",
    mimetype: "image/webp",
    size: 5,
    buffer: Buffer.from("data!"),
  });

  assert.strictEqual(jpegResult.success, false);
  assert.match(jpegResult.error || "", /mime|permitido/i);
  assert.strictEqual(webpResult.success, true);
  assert.strictEqual(oversizedResult.success, false);
  assert.match(oversizedResult.error || "", /tamaño|excede/i);
});
