import assert from "node:assert/strict";
import test from "node:test";
import { createHealthRepository } from "../../src/data/healthRepository.js";
import { createHealthService } from "../../src/logic/healthService.js";

test("health response reports service status and environment", () => {
  const healthRepository = createHealthRepository();
  const healthService = createHealthService(healthRepository, "test");
  const response = healthService.getHealth();

  assert.deepEqual(response, {
    name: "equipo-4-mlops",
    status: "ok",
    environment: "test",
  });
});
