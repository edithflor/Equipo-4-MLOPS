import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

test("presentation upload route does not import MinIO directly", async () => {
  const source = await readFile(
    join(projectRoot, "src", "presentation", "uploadRoutes.ts"),
    "utf8",
  );

  assert.doesNotMatch(source, /minio/i);
  assert.doesNotMatch(source, /putObject/);
});

test("seed is non-destructive and uploads real image bytes through the data layer", async () => {
  const source = await readFile(join(projectRoot, "src", "data", "seed.ts"), "utf8");

  assert.doesNotMatch(source, /db\.delete/);
  assert.match(source, /putImageObjectIfMissing/);
  assert.match(source, /image\/jpeg/);
  assert.match(source, /image\/png/);
  assert.match(source, /onDuplicateKeyUpdate/);
});
