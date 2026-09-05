import { z } from "zod";
import { env } from "../config/env.js";

export interface UploadImageInput {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadValidationConfig {
  maxBytes: number;
  mimeAllowlist: string;
}

function parseMimeAllowlist(value: string): string[] {
  return value
    .split(",")
    .map((mime) => mime.trim())
    .filter(Boolean);
}

export class UploadValidationService {
  private readonly schema: z.ZodType<UploadImageInput>;

  public constructor(
    config: UploadValidationConfig = {
      maxBytes: env.UPLOAD_MAX_BYTES,
      mimeAllowlist: env.UPLOAD_MIME_ALLOWLIST,
    },
  ) {
    const allowedMimes = parseMimeAllowlist(config.mimeAllowlist);

    this.schema = z.object({
      filename: z.string().min(1, "El nombre de archivo es obligatorio"),
      mimetype: z.string().refine((value) => allowedMimes.includes(value), {
        message: "Tipo de archivo no permitido (mime inválido)",
      }),
      size: z.number().max(config.maxBytes, "El tamaño del archivo excede el límite permitido"),
      buffer: z.instanceof(Buffer),
    });
  }

  public validate(payload: unknown): { success: boolean; data?: UploadImageInput; error?: string } {
    const result = this.schema.safeParse(payload);

    if (!result.success) {
      const errorMsg =
        result.error?.issues?.map((e) => e.message).join(", ") ||
        result.error?.message ||
        "Error de validación";
      return { success: false, error: errorMsg };
    }
    return { success: true, data: result.data };
  }
}
