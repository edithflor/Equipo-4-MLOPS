import { float, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
});

export const images = mysqlTable("images", {
  id: varchar("id", { length: 36 }).primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimetype: varchar("mimetype", { length: 100 }).notNull(),
  size: int("size").notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bboxes = mysqlTable("bboxes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  imageId: varchar("image_id", { length: 36 })
    .notNull()
    .references(() => images.id, { onDelete: "cascade" }),
  categoryId: int("category_id")
    .notNull()
    .references(() => categories.id),
  x: float("x").notNull(),
  y: float("y").notNull(),
  width: float("width").notNull(),
  height: float("height").notNull(),
});
