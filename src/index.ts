import express from "express";
import { env } from "./config/env";
import annotationRoutes from "./presentation/annotationRoutes";
import categoryRoutes from "./presentation/categoryRoutes";
import uploadRoutes from "./presentation/uploadRoutes";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api", uploadRoutes);
app.use("/api", annotationRoutes);
app.use("/api", categoryRoutes);

const port =
  env.NODE_ENV === "production"
    ? env.APP_PORT_PROD
    : env.APP_PORT_DEV;

app.listen(port, () => {
  console.log(
    `Server running on http://localhost:${port}`,
  );
});