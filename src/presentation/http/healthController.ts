import type { IncomingMessage, ServerResponse } from "node:http";
import type { HealthService } from "../../logic/healthService.js";

export function createHealthController(healthService: HealthService) {
  return (_request: IncomingMessage, response: ServerResponse) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(healthService.getHealth()));
  };
}
