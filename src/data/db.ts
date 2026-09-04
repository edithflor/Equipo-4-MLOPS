import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

export const poolConnection = mysql.createPool({
  host: env.MARIADB_HOST,
  user: env.MARIADB_USER,
  password: env.MARIADB_PASSWORD,
  database: env.MARIADB_DATABASE,
  port: env.MARIADB_PORT,
});

export const db = drizzle(poolConnection, { schema, mode: "default" });
