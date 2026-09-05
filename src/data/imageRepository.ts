import { db } from "./db.js";
import { buildObjectUrl, putImageObjectIfMissing } from "./objectStorage.js";
import { images } from "./schema.js";

export class ImageRepository {
  public async save(data: {
    id: string;
    filename: string;
    mimetype: string;
    size: number;
    url: string;
  }): Promise<void> {
    await db.insert(images).values(data);
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

    const url = buildObjectUrl(data.objectName);

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
