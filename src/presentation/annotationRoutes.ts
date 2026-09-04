import { Router } from "express";
import { AnnotationRepository } from "../data/annotationRepository.js";
import { BoundingBox } from "../logic/bboxService.js";

export const annotationRoutes = Router();
const repo = new AnnotationRepository();

annotationRoutes.post("/", async (req, res) => {
  try {
    const box = new BoundingBox(req.body);
    await repo.save(box.data);
    res.status(201).json(box.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    res.status(400).json({ error: message });
  }
});

annotationRoutes.get("/image/:imageId", async (req, res) => {
  try {
    const boxes = await repo.getByImageId(req.params.imageId);
    res.status(200).json(boxes);
  } catch {
    res.status(500).json({ error: "Error al recuperar anotaciones" });
  }
});

annotationRoutes.put("/:id", async (req, res) => {
  try {
    const { x, y, width, height } = req.body;
    await repo.updateGeometry(req.params.id, x, y, width, height);
    res.status(200).json({ success: true, message: "Geometría actualizada" });
  } catch {
    res.status(500).json({ error: "Error al actualizar caja" });
  }
});

annotationRoutes.delete("/:id", async (req, res) => {
  try {
    await repo.delete(req.params.id);
    res.status(200).json({ success: true, message: "Caja eliminada" });
  } catch {
    res.status(500).json({ error: "Error al eliminar caja" });
  }
});
