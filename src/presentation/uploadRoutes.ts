import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { ImageRepository } from "../data/imageRepository.js";
import { UploadValidationService } from "../logic/uploadValidation.js";

export const uploadRoutes = Router();
const upload = multer({ storage: multer.memoryStorage() });
const validationService = new UploadValidationService();
const imageRepo = new ImageRepository();

uploadRoutes.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se envió ningún archivo" });
  }

  const validation = validationService.validate({
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    buffer: req.file.buffer,
  });

  if (!validation.success || !validation.data) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const fileData = validation.data;
    const fileId = crypto.randomUUID();
    const objectName = `${fileId}-${fileData.filename}`;

    const url = await imageRepo.saveUploadedImage({
      id: fileId,
      filename: fileData.filename,
      mimetype: fileData.mimetype,
      size: fileData.size,
      buffer: fileData.buffer,
      objectName,
    });

    return res.status(201).json({ success: true, imageId: fileId, url });
  } catch {
    return res.status(500).json({ error: "Error interno guardando la imagen" });
  }
});
