import { Router } from "express";
import { listCategories } from "../data/categoryRepository.js";

export const categoryRoutes = Router();

categoryRoutes.get("/", async (req, res) => {
  try {
    const categories = await listCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las categorías" });
  }
});
