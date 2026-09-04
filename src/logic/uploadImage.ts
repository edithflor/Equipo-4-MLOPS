import crypto from "node:crypto";

import {
  validateUpload,
  type UploadInput,
} from "./uploadValidation";

import { env } from "../config/env";

import {
  createImage,
} from "../data/imageRepository";

import {
  BUCKET_NAME,
  minioClient,
} from "../lib/minio";

export class UploadValidationError
  extends Error {
  constructor(
    public readonly code:
      | "INVALID_MIME"
      | "FILE_TOO_LARGE",
    message: string,
  ) {
    super(message);
  }
}

export async function uploadImage(
  input: UploadInput,
) {
  try {
    validateUpload(input, {
      maxBytes:
        env.UPLOAD_MAX_BYTES,

      allowedMimeTypes:
        env.UPLOAD_MIME_ALLOWLIST,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "INVALID_MIME"
    ) {
      throw new UploadValidationError(
        "INVALID_MIME",
        "El tipo de archivo no está permitido.",
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "FILE_TOO_LARGE"
    ) {
      throw new UploadValidationError(
        "FILE_TOO_LARGE",
        "El archivo excede el tamaño máximo permitido.",
      );
    }

    throw error;
  }

  const id =
    crypto.randomUUID();

  const objectKey =
    `images/${id}-${input.filename}`;

  await minioClient.putObject(
    BUCKET_NAME,
    objectKey,
    input.buffer,
    input.sizeBytes,
    {
      "Content-Type":
        input.mimeType,
    },
  );

  try {
    await createImage({
      id,
      filename:
        input.filename,
      mimeType:
        input.mimeType,
      sizeBytes:
        input.sizeBytes,
      minioBucket:
        BUCKET_NAME,
      minioObjectKey:
        objectKey,
      width:
        input.width,
      height:
        input.height,
      status: "ready",
    });
  } catch (error) {
    await minioClient.removeObject(
      BUCKET_NAME,
      objectKey,
    );

    throw error;
  }

  return {
    id,
    filename:
      input.filename,
    objectKey,
  };
}