import { z } from "zod";

const cocoIdSchema = z.union([z.number().int().nonnegative(), z.string().min(1)]);

export const cocoImageSchema = z.object({
  id: cocoIdSchema,
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  file_name: z.string().min(1),
});

export const cocoCategorySchema = z.object({
  id: cocoIdSchema,
  name: z.string().min(1),
});

export const cocoAnnotationSectionSchema = z.object({
  id: cocoIdSchema,
  image_id: cocoIdSchema,
  category_id: cocoIdSchema,
  bbox: z.tuple([
    z.number().nonnegative(),
    z.number().nonnegative(),
    z.number().positive(),
    z.number().positive(),
  ]),
  area: z.number().positive(),
  iscrowd: z.union([z.literal(0), z.literal(1)]),
});

export const cocoDatasetSectionsSchema = z
  .object({
    images: z.array(cocoImageSchema),
    annotations: z.array(cocoAnnotationSectionSchema),
    categories: z.array(cocoCategorySchema),
  })
  .superRefine((dataset, context) => {
    assertUniqueIds("images", dataset.images, context);
    assertUniqueIds("annotations", dataset.annotations, context);
    assertUniqueIds("categories", dataset.categories, context);

    const imageIds = new Set(dataset.images.map((image) => String(image.id)));
    const categoryIds = new Set(dataset.categories.map((category) => String(category.id)));

    for (const annotation of dataset.annotations) {
      if (!imageIds.has(String(annotation.image_id))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `annotation ${annotation.id} references missing image_id ${annotation.image_id}`,
          path: ["annotations"],
        });
      }

      if (!categoryIds.has(String(annotation.category_id))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `annotation ${annotation.id} references missing category_id ${annotation.category_id}`,
          path: ["annotations"],
        });
      }

      if (Math.abs(annotation.area - annotation.bbox[2] * annotation.bbox[3]) > 0.000001) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `annotation ${annotation.id} area must be width * height`,
          path: ["annotations"],
        });
      }
    }
  });

export type CocoId = z.infer<typeof cocoIdSchema>;
export type CocoImage = z.infer<typeof cocoImageSchema>;
export type CocoCategory = z.infer<typeof cocoCategorySchema>;
export type CocoAnnotationSection = z.infer<typeof cocoAnnotationSectionSchema>;
export type CocoDatasetSections = z.infer<typeof cocoDatasetSectionsSchema>;

export interface CocoSourceImage {
  id: CocoId;
  width: number;
  height: number;
  fileName?: string;
  filename?: string;
  objectName?: string;
}

export interface CocoSourceCategory {
  id: CocoId;
  name: string;
}

export interface CocoSourceAnnotation {
  id: CocoId;
  imageId: CocoId;
  categoryId: CocoId;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CocoSourceDataset {
  images: CocoSourceImage[];
  annotations: CocoSourceAnnotation[];
  categories: CocoSourceCategory[];
}

function assertUniqueIds(
  collectionName: string,
  values: Array<{ id: CocoId }>,
  context: z.RefinementCtx,
): void {
  const seen = new Set<string>();

  for (const value of values) {
    const id = String(value.id);

    if (seen.has(id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${collectionName} has duplicate id ${id}`,
        path: [collectionName],
      });
      return;
    }

    seen.add(id);
  }
}

function resolveFileName(image: CocoSourceImage): string {
  return image.fileName ?? image.filename ?? image.objectName ?? "";
}

function buildBbox(annotation: CocoSourceAnnotation): [number, number, number, number] {
  return [annotation.x, annotation.y, annotation.width, annotation.height];
}

export function exportCocoDataset(source: CocoSourceDataset): CocoDatasetSections {
  const dataset = {
    images: source.images.map((image) => ({
      id: image.id,
      width: image.width,
      height: image.height,
      file_name: resolveFileName(image),
    })),
    annotations: source.annotations.map((annotation) => ({
      id: annotation.id,
      image_id: annotation.imageId,
      category_id: annotation.categoryId,
      bbox: buildBbox(annotation),
      area: annotation.width * annotation.height,
      iscrowd: 0,
    })),
    categories: source.categories.map((category) => ({
      id: category.id,
      name: category.name,
    })),
  };

  return cocoDatasetSectionsSchema.parse(dataset);
}
