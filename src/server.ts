import { createServer } from "node:http";
import { env } from "./config/env.js";

const port = env.NODE_ENV === "production" ? env.PROD_APP_PORT : env.APP_PORT;

const server = createServer((_request, response) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(
    JSON.stringify({
      name: "equipo-4-mlops",
      status: "ok",
      environment: env.NODE_ENV,
    }),
  );
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Application listening on port ${port}`);
});
