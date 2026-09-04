import "dotenv/config";
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  APP_PORT_DEV: z.coerce
    .number()
    .int()
    .positive()
    .default(3000),

  APP_PORT_PROD: z.coerce
    .number()
    .int()
    .positive()
    .default(3100),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_ROOT_PASSWORD: z.string().min(1),
  DATABASE_URL: z.string().min(1),

  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),

  MINIO_USE_SSL: z
    .enum(["true", "false"])
    .transform(
      (value) => value === "true",
    ),

  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET_NAME: z.string().min(1),

  UPLOAD_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive(),

  UPLOAD_MIME_ALLOWLIST: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
});

export type Env =
  z.infer<typeof envSchema>;

export function loadEnv(): Env {
  return envSchema.parse(
    process.env,
  );
}

export const env = loadEnv();