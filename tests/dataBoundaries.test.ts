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
  assert.match(clientScript, /fetch\("\/categories"/);
  assert.doesNotMatch(uiSource, /minio/i);
  assert.doesNotMatch(uiSource, /drizzle/i);
  assert.doesNotMatch(uiSource, /mysql/i);
});

test("bbox canvas UI uses annotation APIs for create, load, update, and delete", async () => {
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");

  assert.match(clientScript, /fetch\("\/annotations"/);
  assert.match(clientScript, /fetch\(`\/annotations\/image\/\$\{imageId\}`\)/);
  assert.match(clientScript, /fetch\(`\/annotations\/\$\{annotation\.id\}`/);
  assert.match(clientScript, /fetch\(`\/annotations\/\$\{selectedAnnotationId\}`/);
  assert.match(clientScript, /method: "POST"/);
  assert.match(clientScript, /method: "PUT"/);
  assert.match(clientScript, /method: "DELETE"/);
  assert.match(clientScript, /displayToImageBox/);
  assert.match(clientScript, /imageToDisplayBox/);
  assert.match(clientScript, /Selecciona una categoría antes de crear una caja/);
});

test("category UI uses backend colors and keeps no category selected by default", async () => {
  const html = await readFile(join(projectRoot, "public", "index.html"), "utf8");
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");
  const styles = await readFile(join(projectRoot, "public", "styles.css"), "utf8");

  assert.match(html, /id="category-list"/);
  assert.match(html, /Sin categoría/);
  assert.match(clientScript, /let selectedCategory = null/);
  assert.match(clientScript, /category\.color/);
  assert.match(clientScript, /Selecciona una categoría antes de crear una caja/);
  assert.match(styles, /--category-color/);
  assert.doesNotMatch(styles, /#e74c3c|#3498db|#2ecc71/);
});

test("server mounts category routes for the portal", async () => {
  const source = await readFile(join(projectRoot, "src", "index.ts"), "utf8");

  assert.match(source, /import \{ categoryRoutes \}/);
  assert.match(source, /app\.use\("\/categories", categoryRoutes\)/);
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
