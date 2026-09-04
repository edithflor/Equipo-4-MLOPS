import { db } from "./db.js";
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
}
