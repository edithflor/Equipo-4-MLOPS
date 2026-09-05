import { Router } from "express";
import { DashboardMetricsRepository } from "../data/dashboardMetricsRepository.js";
import { DashboardMetricsService } from "../logic/dashboardMetrics.js";

export const dashboardRoutes = Router();

const metricsRepository = new DashboardMetricsRepository();
const metricsService = new DashboardMetricsService(metricsRepository);

dashboardRoutes.get("/metrics", async (_req, res) => {
  try {
    const metrics = await metricsService.getMetrics();
    return res.status(200).json(metrics);
  } catch {
    return res.status(500).json({ error: "Error interno obteniendo métricas" });
  }
});
