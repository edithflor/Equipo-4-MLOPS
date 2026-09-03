import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type HealthResponse, createHealthResponse } from "../../src/app.js";

interface ScenarioContext {
  environment?: string;
  response?: HealthResponse;
}

type StepHandler = (context: ScenarioContext, match: RegExpMatchArray) => void;

const stepDefinitions: Array<[RegExp, StepHandler]> = [
  [
    /^Given the application environment is "([^"]+)"$/,
    (context, match) => {
      context.environment = match[1];
    },
  ],
  [
    /^When the health response is generated$/,
    (context) => {
      assert.ok(
        context.environment,
        "Expected environment to be defined before generating response",
      );
      context.response = createHealthResponse(context.environment);
    },
  ],
  [
    /^Then the response status should be "([^"]+)"$/,
    (context, match) => {
      assert.equal(context.response?.status, match[1]);
    },
  ],
  [
    /^And the response name should be "([^"]+)"$/,
    (context, match) => {
      assert.equal(context.response?.name, match[1]);
    },
  ],
  [
    /^And the response environment should be "([^"]+)"$/,
    (context, match) => {
      assert.equal(context.response?.environment, match[1]);
    },
  ],
];

function runFeature(featurePath: string): void {
  const feature = readFileSync(featurePath, "utf8");
  const steps = feature
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^(Given|When|Then|And)\b/.test(line));

  const context: ScenarioContext = {};

  for (const step of steps) {
    const definition = stepDefinitions.find(([pattern]) => pattern.test(step));

    assert.ok(definition, `Missing step definition for: ${step}`);

    const [pattern, handler] = definition;
    const match = step.match(pattern);

    assert.ok(match, `Step did not match definition: ${step}`);
    handler(context, match);
  }
}

const featurePath = join(process.cwd(), "tests", "gherkin", "features", "health.feature");

runFeature(featurePath);
console.log("Gherkin specs passed: health.feature");
