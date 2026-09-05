import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

async function loadTransforms() {
  const source = await readFile(join(process.cwd(), "public", "coordinateTransforms.js"), "utf8");
  const factory = new Function(
    `${source.replaceAll("export function", "function")}
    return { displayToImageBox, imageToDisplayBox };`,
  );

  return factory() as {
    displayToImageBox: (
      box: { x: number; y: number; width: number; height: number },
      imageMetrics: {
        naturalWidth: number;
        naturalHeight: number;
        displayWidth: number;
        displayHeight: number;
      },
    ) => { x: number; y: number; width: number; height: number };
    imageToDisplayBox: (
      box: { x: number; y: number; width: number; height: number },
      imageMetrics: {
        naturalWidth: number;
        naturalHeight: number;
        displayWidth: number;
        displayHeight: number;
      },
    ) => { x: number; y: number; width: number; height: number };
  };
}

test("converts display coordinates to original image pixels", async () => {
  const { displayToImageBox } = await loadTransforms();

  assert.deepStrictEqual(
    displayToImageBox(
      { x: 50, y: 40, width: 100, height: 80 },
      { naturalWidth: 1000, naturalHeight: 800, displayWidth: 500, displayHeight: 400 },
    ),
    { x: 100, y: 80, width: 200, height: 160 },
  );
});

test("converts stored image pixels back to displayed coordinates", async () => {
  const { imageToDisplayBox } = await loadTransforms();

  assert.deepStrictEqual(
    imageToDisplayBox(
      { x: 100, y: 80, width: 200, height: 160 },
      { naturalWidth: 1000, naturalHeight: 800, displayWidth: 500, displayHeight: 400 },
    ),
    { x: 50, y: 40, width: 100, height: 80 },
  );
});
