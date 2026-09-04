import assert from "node:assert/strict";
import test from "node:test";

type Bbox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function validateBbox(bbox: Bbox): void {
  if (!Number.isInteger(bbox.x) || bbox.x < 0) {
    throw new Error("INVALID_X");
  }

  if (!Number.isInteger(bbox.y) || bbox.y < 0) {
    throw new Error("INVALID_Y");
  }

  if (!Number.isInteger(bbox.width) || bbox.width <= 0) {
    throw new Error("INVALID_WIDTH");
  }

  if (!Number.isInteger(bbox.height) || bbox.height <= 0) {
    throw new Error("INVALID_HEIGHT");
  }
}

function calculateArea(width: number, height: number): number {
  return width * height;
}

test("bbox válida acepta coordenadas absolutas en píxeles", () => {
  const bbox: Bbox = {
    x: 120,
    y: 80,
    width: 300,
    height: 200,
  };

  assert.doesNotThrow(() => validateBbox(bbox));
});

test("bbox rechaza width menor o igual a cero", () => {
  const bbox: Bbox = {
    x: 10,
    y: 10,
    width: 0,
    height: 100,
  };

  assert.throws(
    () => validateBbox(bbox),
    /INVALID_WIDTH/,
  );
});

test("bbox rechaza height menor o igual a cero", () => {
  const bbox: Bbox = {
    x: 10,
    y: 10,
    width: 100,
    height: -1,
  };

  assert.throws(
    () => validateBbox(bbox),
    /INVALID_HEIGHT/,
  );
});

test("bbox rechaza coordenada x negativa", () => {
  const bbox: Bbox = {
    x: -1,
    y: 10,
    width: 100,
    height: 100,
  };

  assert.throws(
    () => validateBbox(bbox),
    /INVALID_X/,
  );
});

test("bbox rechaza coordenada y negativa", () => {
  const bbox: Bbox = {
    x: 10,
    y: -1,
    width: 100,
    height: 100,
  };

  assert.throws(
    () => validateBbox(bbox),
    /INVALID_Y/,
  );
});

test("area es width por height", () => {
  assert.equal(
    calculateArea(300, 200),
    60000,
  );
});