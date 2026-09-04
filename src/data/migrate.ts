import "../config/env.js";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { db, poolConnection } from "./db.js";

async function runMigrations() {
  console.log("⏳ Ejecutando migraciones de Drizzle...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✅ Migraciones completadas.");
  await poolConnection.end();
}

if (process.argv[1].endsWith("migrate.ts")) {
  runMigrations().catch((err) => {
    console.error("❌ Error en migración:", err);
    process.exit(1);
  });
}
