import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const portSchema = z.coerce.number().int().min(1).max(65535);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  APP_PORT: portSchema,
  PROD_APP_PORT: portSchema,
  MARIADB_HOST: z.string().min(1),
  MARIADB_PORT: portSchema,
  MARIADB_DATABASE: z.string().min(1),
  MARIADB_USER: z.string().min(1),
  MARIADB_PASSWORD: z.string().min(1),
  MARIADB_ROOT_PASSWORD: z.string().min(1),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_API_PORT: portSchema,
  MINIO_CONSOLE_PORT: portSchema,
  MINIO_ROOT_USER: z.string().min(1),
  MINIO_ROOT_PASSWORD: z.string().min(1),
  MINIO_BUCKET_IMAGES: z.string().min(1),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
