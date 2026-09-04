import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";

const poolConnection = mysql.createPool({
  host: env.MARIADB_HOST,
  port: env.MARIADB_PORT,
  user: env.MARIADB_USER,
  password: env.MARIADB_PASSWORD,
  database: env.MARIADB_DATABASE,
});

export const db = drizzle(poolConnection);
