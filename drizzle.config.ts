import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/data/schema.ts",
  out: "./drizzle",
  driver: "mysql2",
  dbCredentials: {
    host: process.env.MARIADB_HOST || "127.0.0.1",
    port: Number(process.env.MARIADB_PORT || 3306),
    user: process.env.MARIADB_USER || "admin",
    password: process.env.MARIADB_PASSWORD || "admin_password",
    database: process.env.MARIADB_DATABASE || "mlops_db",
  },
} satisfies Config;
