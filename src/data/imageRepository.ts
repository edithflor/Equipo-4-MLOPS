import { eq } from "drizzle-orm";
import { db } from "./db.js";
import {
  buildImageContentPath,
  buildImageObjectName,
  getImageObject,
  putImageObjectIfMissing,
} from "./objectStorage.js";
import { images } from "./schema.js";

export interface ImageMetadata {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

function buildPublicImageMetadata(image: ImageMetadata): ImageMetadata {
  return {
    ...image,
    url: buildImageContentPath(image.id),
  };
}

function getObjectNameFromMetadata(image: ImageMetadata): string {
  try {
    const url = new URL(image.url);
    const objectName = url.pathname.split("/").filter(Boolean).at(-1);

    if (objectName && objectName !== "content") {
      return objectName;
    }
  } catch {
    // URLs stored by this app can also be relative backend paths.
  }

  return buildImageObjectName(image);
}

export class ImageRepository {
  public async save(data: ImageMetadata): Promise<void> {
    await db.insert(images).values(data);
  }

  public async list(): Promise<ImageMetadata[]> {
    const imageList = await db.select().from(images);
    return imageList.map(buildPublicImageMetadata);
  }

  public async findById(id: string): Promise<ImageMetadata | undefined> {
    const [image] = await db.select().from(images).where(eq(images.id, id)).limit(1);
    return image;
  }

  public async getImageContent(id: string): Promise<{
    image: ImageMetadata;
    stream: NodeJS.ReadableStream;
  } | null> {
    const image = await this.findById(id);

    if (!image) {
      return null;
    }

    const objectName = getObjectNameFromMetadata(image);
    const stream = await getImageObject(objectName);

    return { image: buildPublicImageMetadata(image), stream };
  }

  public async saveUploadedImage(data: {
    id: string;
    filename: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
    objectName: string;
  }): Promise<string> {
    await putImageObjectIfMissing({
      objectName: data.objectName,
      buffer: data.buffer,
      mimetype: data.mimetype,
    });

    const url = buildImageContentPath(data.id);

    await this.save({
      id: data.id,
      filename: data.filename,
      mimetype: data.mimetype,
      size: data.size,
      url,
    });

    return url;
  }
}
