import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { annotationRoutes } from "./presentation/annotationRoutes.js";
import { uploadRoutes } from "./presentation/uploadRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("/annotations", annotationRoutes);
app.use("/upload", uploadRoutes);

// Healthcheck
app.get("/health", (req, res) => {
  res.json({ status: "ok", environment: env.NODE_ENV });
});

// Manejo dinámico de puertos corregido
const port = env.NODE_ENV === "production" ? env.PROD_APP_PORT : env.APP_PORT;

app.listen(port, () => {
  console.log(`[Server] Corriendo en http://localhost:${port} en modo ${env.NODE_ENV}`);
});
