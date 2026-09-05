import type { CocoSourceDataset } from "../logic/cocoExporter.js";
import { db } from "./db.js";
import { ImageRepository } from "./imageRepository.js";
import { bboxes, categories, images } from "./schema.js";

interface ImageDimensions {
  width: number;
  height: number;
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function readPngDimensions(buffer: Buffer): ImageDimensions {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("Invalid PNG image bytes for COCO export.");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer: Buffer): ImageDimensions {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error("Invalid JPEG image bytes for COCO export.");
  }

  let offset = 2;

  while (offset < buffer.length) {
    while (buffer[offset] === 0xff) {
      offset += 1;
    }

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset);
    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  throw new Error("JPEG image dimensions were not found for COCO export.");
}

export function readImageDimensions(buffer: Buffer, mimetype: string): ImageDimensions {
  if (mimetype === "image/png") {
    return readPngDimensions(buffer);
  }

  if (mimetype === "image/jpeg") {
    return readJpegDimensions(buffer);
  }

  throw new Error(`Unsupported image mimetype for COCO export: ${mimetype}`);
}

export class CocoExportRepository {
  private readonly imageRepository = new ImageRepository();

  public async getSourceDataset(): Promise<CocoSourceDataset> {
    const [persistedImages, persistedCategories, persistedAnnotations] = await Promise.all([
      db.select().from(images),
      db.select().from(categories),
      db.select().from(bboxes),
    ]);

    const sourceImages = await Promise.all(
      persistedImages.map(async (image) => {
        const content = await this.imageRepository.getImageContent(image.id);

        if (!content) {
          throw new Error(`Image bytes not found for COCO export: ${image.id}`);
        }

        const buffer = await streamToBuffer(content.stream);
        const dimensions = readImageDimensions(buffer, image.mimetype);

        return {
          id: image.id,
          width: dimensions.width,
          height: dimensions.height,
          filename: image.filename,
        };
      }),
    );

    return {
      images: sourceImages,
      annotations: persistedAnnotations.map((annotation) => ({
        id: annotation.id,
        imageId: annotation.imageId,
        categoryId: annotation.categoryId,
        x: annotation.x,
        y: annotation.y,
        width: annotation.width,
        height: annotation.height,
      })),
      categories: persistedCategories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
    };
  }
}
