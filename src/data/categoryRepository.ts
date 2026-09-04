import { db } from "./db.js";
import { categories } from "./schema.js";

export class CategoryRepository {
  public async getAll() {
    return await db.select().from(categories);
  }
}

// Función auxiliar para compatibilidad con rutas existentes
export async function listCategories() {
  const repo = new CategoryRepository();
  return await repo.getAll();
}
