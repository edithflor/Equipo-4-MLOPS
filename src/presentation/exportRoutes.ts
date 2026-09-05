import { Router } from "express";
import { CocoExportRepository } from "../data/cocoExportRepository.js";
import { type CocoSourceDataset, exportCocoDataset } from "../logic/cocoExporter.js";

export interface CocoExportDataSource {
  getSourceDataset(): Promise<CocoSourceDataset>;
}

export function createExportRoutes(dataSource: CocoExportDataSource = new CocoExportRepository()) {
  const exportRoutes = Router();

  exportRoutes.get("/coco", async (_req, res) => {
    try {
      const sourceDataset = await dataSource.getSourceDataset();
      const cocoDataset = exportCocoDataset(sourceDataset);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", 'attachment; filename="coco-dataset.json"');

      return res.status(200).send(JSON.stringify(cocoDataset, null, 2));
    } catch {
      return res.status(500).json({ error: "Error interno exportando COCO" });
    }
  });

  return exportRoutes;
}

export const exportRoutes = createExportRoutes();
