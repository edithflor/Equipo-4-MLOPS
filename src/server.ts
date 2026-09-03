import { createServer } from "node:http";
import { createRequestHandler } from "./app.js";
import { env } from "./config/env.js";

const port = env.NODE_ENV === "production" ? env.PROD_APP_PORT : env.APP_PORT;

const server = createServer(createRequestHandler(env.NODE_ENV));

server.listen(port, "0.0.0.0", () => {
  console.log(`Application listening on port ${port}`);
});
