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

test("browser UI consumes HTTP APIs and does not reference storage or database drivers", async () => {
  const html = await readFile(join(projectRoot, "public", "index.html"), "utf8");
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");
  const uiSource = `${html}\n${clientScript}`;

  assert.match(html, /type="file"/);
  assert.match(html, /accept="image\/jpeg,image\/png"/);
  assert.match(clientScript, /fetch\("\/upload"/);
  assert.match(clientScript, /fetch\("\/images"/);
  assert.doesNotMatch(uiSource, /minio/i);
  assert.doesNotMatch(uiSource, /drizzle/i);
  assert.doesNotMatch(uiSource, /mysql/i);
});

test("image presentation routes list persisted images and proxy bytes through the backend", async () => {
  const source = await readFile(join(projectRoot, "src", "presentation", "imageRoutes.ts"), "utf8");
  const repositorySource = await readFile(
    join(projectRoot, "src", "data", "imageRepository.ts"),
    "utf8",
  );

  assert.match(source, /imageRoutes\.get\("\/"/);
  assert.match(source, /imageRoutes\.get\("\/:id\/content"/);
  assert.match(source, /imageRepo\.list/);
  assert.match(source, /imageRepo\.getImageContent/);
  assert.match(repositorySource, /buildImageContentPath\(image\.id\)/);
  assert.doesNotMatch(source, /minio/i);
  assert.doesNotMatch(source, /drizzle/i);
  assert.doesNotMatch(source, /mysql/i);
});

test("seed is non-destructive and uploads real image bytes through the data layer", async () => {
  const source = await readFile(join(projectRoot, "src", "data", "seed.ts"), "utf8");

  assert.doesNotMatch(source, /db\.delete/);
  assert.match(source, /putImageObject/);
  assert.match(source, /image\/jpeg/);
  assert.match(source, /image\/png/);
  assert.match(source, /onDuplicateKeyUpdate/);
});
