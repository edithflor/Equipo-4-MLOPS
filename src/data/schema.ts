import {
  float,
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  color: varchar("color", { length: 7 }).notNull(),
});

export const images = mysqlTable(
  "images",
  {
    id: int("id").primaryKey().autoincrement(),
    objectKey: varchar("object_key", { length: 255 }).notNull().unique(),
    width: int("width"),
    height: int("height"),
    mime: varchar("mime", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  }),
);

export const annotations = mysqlTable(
  "annotations",
  {
    id: int("id").primaryKey().autoincrement(),
    imageId: int("image_id")
      .notNull()
      .references(() => images.id),
    categoryId: int("category_id")
      .notNull()
      .references(() => categories.id),
    x: float("x").notNull(),
    y: float("y").notNull(),
    width: float("width").notNull(),
    height: float("height").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    categoryIdIdx: index("category_id_idx").on(table.categoryId),
    imageIdIdx: index("image_id_idx").on(table.imageId),
    annotationCreatedAtIdx: index("annotation_created_at_idx").on(table.createdAt),
  }),
);
