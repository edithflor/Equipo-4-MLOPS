import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env.js";

export default defineConfig({
  schema: "./src/data/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: env.MARIADB_HOST,
    user: env.MARIADB_USER,
    password: env.MARIADB_PASSWORD,
    database: env.MARIADB_DATABASE,
    port: env.MARIADB_PORT,
  },
});
