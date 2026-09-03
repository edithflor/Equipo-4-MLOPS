import type { HealthRepository } from "../data/healthRepository.js";

export interface HealthResponse {
  name: "equipo-4-mlops";
  status: "ok";
  environment: string;
}

export interface HealthService {
  getHealth(): HealthResponse;
}

export function createHealthService(
  healthRepository: HealthRepository,
  environment: string,
): HealthService {
  return {
    getHealth() {
      return {
        ...healthRepository.getServiceMetadata(),
        status: "ok",
        environment,
      };
    },
  };
}
