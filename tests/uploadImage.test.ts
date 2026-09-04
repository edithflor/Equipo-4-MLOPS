import assert from "node:assert/strict";
import test from "node:test";

import {
  validateUpload,
} from "../src/logic/uploadValidation";

const LIMITS = {
  maxBytes: 5 * 1024 * 1024,

  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
  ],
};

function createInput(
  overrides: Partial<{
    filename: string;
    mimeType: string;
    sizeBytes: number;
    width: number;
    height: number;
  }> = {},
) {
  return {
    filename:
      overrides.filename ??
      "campus.jpg",

    mimeType:
      overrides.mimeType ??
      "image/jpeg",

    sizeBytes:
      overrides.sizeBytes ??
      1024,

    buffer:
      Buffer.from("fake-image"),

    width:
      overrides.width ??
      1920,

    height:
      overrides.height ??
      1080,
  };
}

test("acepta JPEG válido", () => {
  assert.doesNotThrow(() =>
    validateUpload(
      createInput({
        mimeType:
          "image/jpeg",
      }),
      LIMITS,
    ),
  );
});

test("acepta PNG válido", () => {
  assert.doesNotThrow(() =>
    validateUpload(
      createInput({
        mimeType:
          "image/png",
      }),
      LIMITS,
    ),
  );
});

test("rechaza MIME no permitido", () => {
  assert.throws(
    () =>
      validateUpload(
        createInput({
          filename:
            "archivo.txt",
          mimeType:
            "text/plain",
        }),
        LIMITS,
      ),
    /INVALID_MIME/,
  );
});

test("rechaza archivo demasiado grande", () => {
  assert.throws(
    () =>
      validateUpload(
        createInput({
          sizeBytes:
            LIMITS.maxBytes + 1,
        }),
        LIMITS,
      ),
    /FILE_TOO_LARGE/,
  );
});

test("rechaza width inválido", () => {
  assert.throws(() =>
    validateUpload(
      createInput({
        width: 0,
      }),
      LIMITS,
    ),
  );
});

test("rechaza height inválido", () => {
  assert.throws(() =>
    validateUpload(
      createInput({
        height: 0,
      }),
      LIMITS,
    ),
  );
});