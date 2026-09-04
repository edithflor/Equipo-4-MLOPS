import { Router } from "express";
import {
  createBbox,
  deleteBbox,
  listBboxes,
  moveBbox,
  resizeBbox,
} from "../logic/bboxService";

const router = Router();

router.post(
  "/images/:imageId/annotations",
  async (req, res) => {
    try {
      const result =
        await createBbox({
          ...req.body,
          imageId:
            req.params.imageId,
        });

      return res.status(201).json({
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        code: "INVALID_ANNOTATION",
        message:
          error instanceof Error
            ? error.message
            : "Anotación inválida.",
      });
    }
  },
);

router.get(
  "/images/:imageId/annotations",
  async (req, res) => {
    const data =
      await listBboxes(
        req.params.imageId,
      );

    return res.json({ data });
  },
);

router.patch(
  "/annotations/:id/move",
  async (req, res) => {
    await moveBbox(
      req.params.id,
      req.body.x,
      req.body.y,
    );

    return res
      .status(204)
      .send();
  },
);

router.patch(
  "/annotations/:id/resize",
  async (req, res) => {
    await resizeBbox(
      req.params.id,
      req.body.width,
      req.body.height,
    );

    return res
      .status(204)
      .send();
  },
);

router.delete(
  "/annotations/:id",
  async (req, res) => {
    await deleteBbox(
      req.params.id,
    );

    return res
      .status(204)
      .send();
  },
);

export default router;