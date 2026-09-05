import { Router } from "express";
import { ZodError } from "zod";
import { SearchRepository } from "../data/searchRepository.js";
import { SearchService } from "../logic/searchQuery.js";

export const searchRoutes = Router();

const searchRepository = new SearchRepository();
const searchService = new SearchService(searchRepository);

searchRoutes.get("/", async (req, res) => {
  try {
    const result = await searchService.search(req.query);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message ?? "Query inválido" });
    }

    return res.status(500).json({ error: "Error interno buscando imágenes" });
  }
});
