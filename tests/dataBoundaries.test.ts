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

test("coco download UI only points to the export endpoint", async () => {
  const html = await readFile(join(projectRoot, "public", "index.html"), "utf8");
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");
  const uiSource = `${html}\n${clientScript}`;

  assert.match(html, /id="download-coco-link"/);
  assert.match(html, /href="\/export\/coco"/);
  assert.match(html, />Descargar COCO</);
  assert.doesNotMatch(clientScript, /exportCocoDataset|cocoDataset|image_id|category_id|iscrowd/);
  assert.doesNotMatch(clientScript, /bbox:\s*\[|area:\s*|file_name/);
  assert.doesNotMatch(uiSource, /drizzle/i);
  assert.doesNotMatch(uiSource, /minio/i);
  assert.doesNotMatch(uiSource, /mysql/i);
});

test("bbox canvas UI uses annotation APIs for create, load, update, and delete", async () => {
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");

  assert.match(clientScript, /fetch\("\/annotations"/);
  assert.match(clientScript, /fetch\(`\/annotations\/image\/\$\{imageId\}`\)/);
  assert.match(clientScript, /fetch\(`\/annotations\/\$\{annotation\.id\}`/);
  assert.match(clientScript, /fetch\(`\/annotations\/\$\{annotationId\}`/);
  assert.match(clientScript, /await deleteAnnotation\(selectedAnnotationId\)/);
  assert.match(clientScript, /method: "POST"/);
  assert.match(clientScript, /method: "PUT"/);
  assert.match(clientScript, /method: "DELETE"/);
  assert.match(clientScript, /displayToImageBox/);
  assert.match(clientScript, /imageToDisplayBox/);
  assert.match(clientScript, /Selecciona una categoría antes de crear una caja/);
});

test("f4-04 toolbar exposes zoom, undo, navigation, and save-next controls", async () => {
  const html = await readFile(join(projectRoot, "public", "index.html"), "utf8");

  assert.match(html, /id="zoom-in-button"/);
  assert.match(html, /id="zoom-out-button"/);
  assert.match(html, /id="undo-button"/);
  assert.match(html, /id="previous-image-button"/);
  assert.match(html, /id="next-image-button"/);
  assert.match(html, /id="save-next-button"/);
  assert.match(html, />Guardar y siguiente</);
});

test("f4-04 zoom is visual-only and does not persist annotation coordinates", async () => {
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");
  const zoomInHandler = clientScript.match(
    /zoomInButton\.addEventListener\("click", \(\) => \{[\s\S]*?\n\}\);/,
  );
  const zoomOutHandler = clientScript.match(
    /zoomOutButton\.addEventListener\("click", \(\) => \{[\s\S]*?\n\}\);/,
  );

  assert.match(clientScript, /let zoomLevel = 1/);
  assert.match(clientScript, /const MIN_ZOOM = 0\.5/);
  assert.match(clientScript, /const MAX_ZOOM = 3/);
  assert.match(clientScript, /function applyZoom\(\)/);
  assert.match(clientScript, /BASE_CANVAS_WIDTH \* zoomLevel/);
  assert.match(clientScript, /zoomLevel \+= ZOOM_STEP/);
  assert.match(clientScript, /zoomLevel -= ZOOM_STEP/);
  assert.ok(zoomInHandler);
  assert.ok(zoomOutHandler);
  assert.doesNotMatch(zoomInHandler[0], /fetch|method:/);
  assert.doesNotMatch(zoomOutHandler[0], /fetch|method:/);
});

test("f4-04 undo persists create rollback with DELETE and move rollback with PUT", async () => {
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");

  assert.match(clientScript, /let historyStack = \[\]/);
  assert.match(clientScript, /type: "create"/);
  assert.match(clientScript, /await deleteAnnotation\(payload\.id\)/);
  assert.match(clientScript, /type: "update"/);
  assert.match(clientScript, /previousGeometry/);
  assert.match(clientScript, /await persistAnnotationGeometry\(annotation, previousGeometry\)/);
  assert.match(clientScript, /method: "DELETE"/);
  assert.match(clientScript, /method: "PUT"/);
});

test("f4-04 navigation uses real image list and reloads annotations per image", async () => {
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");

  assert.match(clientScript, /let selectedImageIndex = -1/);
  assert.match(clientScript, /async function goToImage\(nextIndex\)/);
  assert.match(clientScript, /await selectImage\(images\[nextIndex\]\)/);
  assert.match(clientScript, /fetch\(`\/annotations\/image\/\$\{imageId\}`\)/);
  assert.match(clientScript, /Ya estás en la primera imagen/);
  assert.match(clientScript, /Ya estás en la última imagen/);
  assert.match(clientScript, /Anotaciones guardadas\. Siguiente imagen lista\./);
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
