import { type SQL, and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";
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
    createdAt: item.createdAt,
  };
}

export class SearchRepository {
  public constructor(private readonly database: MySql2Database = db) {}

  private buildImageFilterConditions(query: ParsedSearchQuery): SQL[] {
    const conditions: SQL[] = [];

    if (query.status === "annotated") {
      conditions.push(
        sql`exists (select 1 from bboxes as status_bboxes where status_bboxes.image_id = ${images.id})`,
      );
    }

    if (query.status === "pending") {
      conditions.push(
        sql`not exists (select 1 from bboxes as status_bboxes where status_bboxes.image_id = ${images.id})`,
      );
    }

    if (query.from) {
      conditions.push(gte(images.createdAt, query.from));
    }

    if (query.toExclusive) {
      conditions.push(lt(images.createdAt, query.toExclusive));
    }

    return conditions;
  }

  private buildMatchingImagesSubquery(query: ParsedSearchQuery) {
    const lowerCategoryName = sql<string>`lower(${categories.name})`;
    const matchedCategoryCount = sql<number>`count(distinct lower(${categories.name}))`;
    const filterConditions = this.buildImageFilterConditions(query);
    const whereConditions =
      query.terms.length > 0
        ? [inArray(lowerCategoryName, query.terms), ...filterConditions]
        : filterConditions;

    const matchingImagesQuery = this.database
      .select({ imageId: images.id })
      .from(images)
      .$dynamic();

    if (query.terms.length > 0) {
      matchingImagesQuery
        .innerJoin(bboxes, eq(images.id, bboxes.imageId))
        .innerJoin(categories, eq(bboxes.categoryId, categories.id));
    }

    if (whereConditions.length > 0) {
      matchingImagesQuery.where(and(...whereConditions));
    }

    matchingImagesQuery.groupBy(images.id);

    if (query.terms.length > 0) {
      matchingImagesQuery.having(sql`${matchedCategoryCount} = ${query.terms.length}`);
    }

    return matchingImagesQuery.as("matching_images");
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
          createdAt: images.createdAt,
        })
        .from(images)
        .innerJoin(matchingImagesForItems, eq(images.id, matchingImagesForItems.imageId))
        .orderBy(images.createdAt, images.id)
        .limit(query.limit)
        .offset(query.offset),
      this.database.select({ value: count() }).from(matchingImagesForTotal),
    ]);

    return {
      items: items.map(toPublicSearchItem),
      total: totalRows[0]?.value ?? 0,
      page: query.page,
      limit: query.limit,
    };
  }
}
