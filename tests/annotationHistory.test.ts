import assert from "node:assert/strict";
import test from "node:test";
import { AnnotationHistory } from "../src/logic/annotationHistory";

test("history inicia vacía", () => {
  const history = new AnnotationHistory();

  assert.equal(history.size, 0);
});

test("push agrega una acción", () => {
  const history = new AnnotationHistory();

  history.push({
    type: "create",
    annotationId: "bbox-1",
    undo: async () => {},
  });

  assert.equal(history.size, 1);
});

test("undo ejecuta la acción inversa", async () => {
  const history = new AnnotationHistory();

  let reverted = false;

  history.push({
    type: "create",
    annotationId: "bbox-1",
    undo: async () => {
      reverted = true;
    },
  });

  const result = await history.undo();

  assert.equal(result, true);

  assert.equal(reverted, true);

  assert.equal(history.size, 0);
});

test("undo sin historial devuelve false", async () => {
  const history = new AnnotationHistory();

  const result = await history.undo();

  assert.equal(result, false);
});

test("dos undo se ejecutan en orden LIFO", async () => {
  const history = new AnnotationHistory();

  const executed: string[] = [];

  history.push({
    type: "create",
    annotationId: "bbox-1",
    undo: async () => {
      executed.push("bbox-1");
    },
  });

  history.push({
    type: "create",
    annotationId: "bbox-2",
    undo: async () => {
      executed.push("bbox-2");
    },
  });

  await history.undo();
  await history.undo();

  assert.deepEqual(executed, ["bbox-2", "bbox-1"]);
});
