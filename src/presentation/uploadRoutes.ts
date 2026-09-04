import { Router } from "express";
import multer from "multer";
import {
  uploadImage,
  UploadValidationError,
} from "../logic/uploadImage";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/images",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          code: "FILE_REQUIRED",
          message:
            "Debes enviar una imagen.",
        });
      }

      const width =
        Number(req.body.width);

      const height =
        Number(req.body.height);

      const result =
        await uploadImage({
          filename:
            req.file.originalname,
          mimeType:
            req.file.mimetype,
          sizeBytes:
            req.file.size,
          buffer:
            req.file.buffer,
          width,
          height,
        });

      return res.status(201).json({
        data: result,
      });
    } catch (error) {
      if (
        error instanceof
        UploadValidationError
      ) {
        return res.status(400).json({
          code: error.code,
          message: error.message,
        });
      }

      console.error(error);

      return res.status(500).json({
        code: "UPLOAD_FAILED",
        message:
          "No fue posible guardar la imagen.",
      });
    }
  },
);

export default router;
