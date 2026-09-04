import { eq } from "drizzle-orm";
import { db } from "./db";
import { categories } from "../db/schema";

export async function findCategoryById(id: string) {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  return rows[0];
}

export async function listCategories() {
  return db.select().from(categories);
}
