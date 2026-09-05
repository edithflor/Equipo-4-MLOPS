import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "./db.js";

async function main() {
  try {
    console.log("Ejecutando migraciones...");
    // Drizzle escanea automáticamente la carpeta out buscando archivos SQL
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migraciones completadas con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("Error ejecutando migraciones:", error);
    process.exit(1);
  }
}

main();
