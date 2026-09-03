import assert from "node:assert/strict";
import test from "node:test";
import { createHealthResponse } from "../../src/app.js";

test("health response reports service status and environment", () => {
  const response = createHealthResponse("test");

  assert.deepEqual(response, {
    name: "equipo-4-mlops",
    status: "ok",
    environment: "test",
  });
});
