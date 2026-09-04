import crypto from "node:crypto";
import { z } from "zod";
import {
  createAnnotation,
  listAnnotationsByImage,
  removeAnnotation,
  updateAnnotation,
} from "../data/annotationRepository";
import { findCategoryById } from "../data/categoryRepository";

const bboxSchema = z.object({
  imageId: z.string().uuid(),
  categoryId: z.string().uuid(),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type BboxInput =
  z.infer<typeof bboxSchema>;

export async function createBbox(
  input: BboxInput,
) {
  const data = bboxSchema.parse(input);

  const category =
    await findCategoryById(data.categoryId);

  if (!category) {
    throw new Error(
      "CATEGORY_NOT_FOUND",
    );
  }

  const annotation = {
    id: crypto.randomUUID(),
    imageId: data.imageId,
    categoryId: data.categoryId,
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    area: data.width * data.height,
  };

  await createAnnotation(annotation);

  return annotation;
}

export async function moveBbox(
  id: string,
  x: number,
  y: number,
) {
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0
  ) {
    throw new Error(
      "INVALID_COORDINATES",
    );
  }

  await updateAnnotation(id, {
    x,
    y,
  });
}

export async function resizeBbox(
  id: string,
  width: number,
  height: number,
) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error(
      "INVALID_GEOMETRY",
    );
  }

  await updateAnnotation(id, {
    width,
    height,
    area: width * height,
  });
}

export async function deleteBbox(
  id: string,
) {
  await removeAnnotation(id);
}

export async function listBboxes(
  imageId: string,
) {
  return listAnnotationsByImage(imageId);
}
