import { readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { env } from "../config/env";

async function migrate(): Promise<void> {
  const connection = await mysql.createConnection(env.DATABASE_URL);

  try {
    const migrationsDir = path.resolve("drizzle");

    // En el proyecto real conviene usar el runner de migraciones de Drizzle.
    // Este archivo centraliza el punto de entrada de migración.
    const migrationFile = path.join(
      migrationsDir,
      "0000_initial.sql",
    );

    const sql = await readFile(migrationFile, "utf8");

    const statements = sql
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await connection.query(statement);
    }

    console.log("Migraciones aplicadas correctamente.");
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error("Error ejecutando migraciones:", error);
  process.exit(1);
});
