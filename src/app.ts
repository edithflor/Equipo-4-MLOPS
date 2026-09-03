import type { IncomingMessage, ServerResponse } from "node:http";

export type HealthStatus = "ok";

export interface HealthResponse {
  name: "equipo-4-mlops";
  status: HealthStatus;
  environment: string;
}

export function createHealthResponse(environment: string): HealthResponse {
  return {
    name: "equipo-4-mlops",
    status: "ok",
    environment,
  };
}

export function createRequestHandler(environment: string) {
  return (_request: IncomingMessage, response: ServerResponse) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(createHealthResponse(environment)));
  };
}
