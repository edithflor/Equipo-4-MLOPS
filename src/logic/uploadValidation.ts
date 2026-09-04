import { z } from "zod";

const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES || 5242880);
const ALLOWED_MIMES = (process.env.UPLOAD_MIME_ALLOWLIST || "image/jpeg,image/png").split(",");

export const UploadImageSchema = z.object({
  filename: z.string().min(1, "El nombre de archivo es obligatorio"),
  mimetype: z.string().refine((val) => ALLOWED_MIMES.includes(val), {
    message: "Tipo de archivo no permitido (mime inválido)",
  }),
  size: z.number().max(MAX_BYTES, "El tamaño del archivo excede el límite permitido"),
  buffer: z.instanceof(Buffer),
});

export type UploadImageInput = z.infer<typeof UploadImageSchema>;
export class UploadValidationService {
  public validate(payload: unknown): { success: boolean; data?: UploadImageInput; error?: string } {
    const result = UploadImageSchema.safeParse(payload);
    if (!result.success) {
      // Extrae los mensajes de forma segura sea cual sea la versión de Zod
      const errorMsg =
        result.error?.issues?.map((e) => e.message).join(", ") ||
        result.error?.message ||
        "Error de validación";
      return { success: false, error: errorMsg };
    }
    return { success: true, data: result.data };
  }
}
