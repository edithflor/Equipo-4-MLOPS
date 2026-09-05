import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_PORT: z.coerce.number().default(3000),
  PROD_APP_PORT: z.coerce.number().default(3100),

  MARIADB_HOST: z.string(),
  MARIADB_PORT: z.coerce.number().default(3306),
  MARIADB_DATABASE: z.string(),
  MARIADB_USER: z.string(),
  MARIADB_PASSWORD: z.string(),
  MARIADB_ROOT_PASSWORD: z.string().optional(),

  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z.preprocess((val) => val === "true" || val === true, z.boolean()),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET_NAME: z.string(),

  UPLOAD_MAX_BYTES: z.coerce.number().default(5242880),
  UPLOAD_MIME_ALLOWLIST: z.string().default("image/jpeg,image/png"),
});

export const env = envSchema.parse(process.env);
