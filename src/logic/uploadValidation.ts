import { z } from "zod";

export const uploadInputSchema =
  z.object({
    filename: z
      .string()
      .min(1),

    mimeType: z
      .string()
      .min(1),

    sizeBytes: z
      .number()
      .int()
      .positive(),

    buffer: z
      .instanceof(Buffer),

    width: z
      .number()
      .int()
      .positive(),

    height: z
      .number()
      .int()
      .positive(),
  });

export type UploadInput =
  z.infer<
    typeof uploadInputSchema
  >;

export type UploadLimits = {
  maxBytes: number;
  allowedMimeTypes: string[];
};

export function validateUpload(
  input: UploadInput,
  limits: UploadLimits,
): void {
  const data =
    uploadInputSchema.parse(input);

  if (
    !limits.allowedMimeTypes.includes(
      data.mimeType,
    )
  ) {
    throw new Error(
      "INVALID_MIME",
    );
  }

  if (
    data.sizeBytes >
    limits.maxBytes
  ) {
    throw new Error(
      "FILE_TOO_LARGE",
    );
  }
}