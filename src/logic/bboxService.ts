import { z } from "zod";

export const BoundingBoxSchema = z.object({
  id: z.string().uuid().optional(),
  imageId: z.string().uuid(),
  categoryId: z
    .number()
    .int()
    .positive("Toda caja debe pertenecer a una categoría válida (Cero cajas sin categoría)"),
  x: z.number().min(0, "La coordenada X debe ser positiva (píxeles absolutos)"),
  y: z.number().min(0, "La coordenada Y debe ser positiva (píxeles absolutos)"),
  width: z.number().positive("El ancho debe ser mayor a 0"),
  height: z.number().positive("El alto debe ser mayor a 0"),
});

export type BoundingBoxInput = z.infer<typeof BoundingBoxSchema>;

export class BoundingBox {
  public readonly id: string;
  public data: BoundingBoxInput;

  constructor(data: BoundingBoxInput) {
    const result = BoundingBoxSchema.safeParse(data);
    if (!result.success) {
      // Corregido: "issues" en lugar de "errors" para la sintaxis correcta de Zod
      throw new Error(`Invariante de clase violada: ${result.error.issues[0].message}`);
    }
    this.id = data.id || crypto.randomUUID();
    this.data = { ...data, id: this.id };
  }

  public move(newX: number, newY: number): void {
    if (newX < 0 || newY < 0) throw new Error("Las coordenadas no pueden ser negativas");
    this.data.x = newX;
    this.data.y = newY;
  }

  public resize(newWidth: number, newHeight: number): void {
    if (newWidth <= 0 || newHeight <= 0) throw new Error("Las dimensiones deben ser mayores a 0");
    this.data.width = newWidth;
    this.data.height = newHeight;
  }
}
