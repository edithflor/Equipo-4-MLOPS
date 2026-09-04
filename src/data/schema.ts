import { mysqlTable, serial, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const imagesTable = mysqlTable("images", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  path: text("path").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const annotationsTable = mysqlTable("annotations", {
  id: serial("id").primaryKey(),
  imageId: serial("image_id").notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
