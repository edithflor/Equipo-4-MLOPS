import { relations } from "drizzle-orm";
import {
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  colorHex: varchar("color_hex", { length: 7 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const images = mysqlTable("images", {
  id: varchar("id", { length: 36 }).primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  sizeBytes: int("size_bytes").notNull(),

  minioBucket: varchar("minio_bucket", { length: 100 }).notNull(),
  minioObjectKey: varchar("minio_object_key", {
    length: 255,
  })
    .notNull()
    .unique(),

  width: int("width").notNull(),
  height: int("height").notNull(),

  status: varchar("status", { length: 50 })
    .notNull()
    .default("pending"),

  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const annotations = mysqlTable(
  "annotations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    imageId: varchar("image_id", { length: 36 })
      .notNull()
      .references(() => images.id),

    categoryId: varchar("category_id", { length: 36 })
      .notNull()
      .references(() => categories.id),

    x: int("x").notNull(),
    y: int("y").notNull(),
    width: int("width").notNull(),
    height: int("height").notNull(),

    area: int("area").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    imageIdx: index("annotations_image_idx").on(table.imageId),
    categoryIdx: index("annotations_category_idx").on(table.categoryId),
  }),
);

export const imagesRelations = relations(images, ({ many }) => ({
  annotations: many(annotations),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  annotations: many(annotations),
}));

export const annotationsRelations = relations(annotations, ({ one }) => ({
  image: one(images, {
    fields: [annotations.imageId],
    references: [images.id],
  }),

  category: one(categories, {
    fields: [annotations.categoryId],
    references: [categories.id],
  }),
}));
