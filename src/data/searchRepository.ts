import { count, eq, inArray, sql } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { ParsedSearchQuery, SearchResponse, SearchResultItem } from "../logic/searchQuery.js";
import { db } from "./db.js";
import { buildImageContentPath } from "./objectStorage.js";
import { bboxes, categories, images } from "./schema.js";

function toPublicSearchItem(item: SearchResultItem): SearchResultItem {
  return {
    id: item.id,
    filename: item.filename,
    mimetype: item.mimetype,
    size: item.size,
    url: buildImageContentPath(item.id),
  };
}

export class SearchRepository {
  public constructor(private readonly database: MySql2Database = db) {}

  private buildMatchingImagesSubquery(query: ParsedSearchQuery) {
    const lowerCategoryName = sql<string>`lower(${categories.name})`;
    const matchedCategoryCount = sql<number>`count(distinct lower(${categories.name}))`;

    return this.database
      .select({ imageId: images.id })
      .from(images)
      .innerJoin(bboxes, eq(images.id, bboxes.imageId))
      .innerJoin(categories, eq(bboxes.categoryId, categories.id))
      .where(inArray(lowerCategoryName, query.terms))
      .groupBy(images.id)
      .having(sql`${matchedCategoryCount} = ${query.terms.length}`)
      .as("matching_images");
  }

  public async searchImagesByCategories(query: ParsedSearchQuery): Promise<SearchResponse> {
    const matchingImagesForItems = this.buildMatchingImagesSubquery(query);
    const matchingImagesForTotal = this.buildMatchingImagesSubquery(query);

    const [items, totalRows] = await Promise.all([
      this.database
        .select({
          id: images.id,
          filename: images.filename,
          mimetype: images.mimetype,
          size: images.size,
          url: images.url,
        })
        .from(images)
        .innerJoin(matchingImagesForItems, eq(images.id, matchingImagesForItems.imageId)),
      this.database.select({ value: count() }).from(matchingImagesForTotal),
    ]);

    return {
      items: items.map(toPublicSearchItem),
      total: totalRows[0]?.value ?? 0,
    };
  }
}
