import { Router } from "express";
import { listCategories } from "../data/categoryRepository";

const router = Router();

router.get(
  "/categories",
  async (_req, res) => {
    const data =
      await listCategories();

    return res.json({
      data,
    });
  },
);

export default router;