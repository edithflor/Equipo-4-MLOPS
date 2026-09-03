import { createHealthRepository } from "./data/healthRepository.js";
import { createHealthService } from "./logic/healthService.js";
import { createHealthController } from "./presentation/http/healthController.js";

export function createApp(environment: string) {
  const healthRepository = createHealthRepository();
  const healthService = createHealthService(healthRepository, environment);

  return createHealthController(healthService);
}
