import { Router } from "express";
import { ImageRepository } from "../data/imageRepository.js";

export const imageRoutes = Router();
const imageRepo = new ImageRepository();

imageRoutes.get("/", async (_req, res) => {
  try {
    const imageList = await imageRepo.list();
    return res.json({ images: imageList });
  } catch {
    return res.status(500).json({ error: "Error interno listando imágenes" });
  }
});

imageRoutes.get("/:id/content", async (req, res) => {
  try {
    const result = await imageRepo.getImageContent(req.params.id);

    if (!result) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }

    res.setHeader("Content-Type", result.image.mimetype);
    res.setHeader("Content-Length", String(result.image.size));
    res.setHeader("Cache-Control", "private, max-age=60");

    result.stream.on("error", () => {
      if (!res.headersSent) {
        res.status(500).json({ error: "Error interno leyendo la imagen" });
      } else {
        res.destroy();
      }
    });

    return result.stream.pipe(res);
  } catch {
    return res.status(500).json({ error: "Error interno leyendo la imagen" });
  }
});
