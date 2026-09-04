import assert from "node:assert";
import test from "node:test";
import { AnnotationSession } from "../src/logic/annotationSession.js";

const mockImages = [
  { id: "image-1", filename: "img1.jpg" },
  { id: "image-2", filename: "img2.jpg" },
  { id: "image-3", filename: "img3.jpg" },
];

test("la sesión inicia con zoom 1", () => {
  const session = new AnnotationSession(mockImages);
  assert.strictEqual(session.getZoomLevel(), 1);
});

test("zoom in aumenta el nivel", () => {
  const session = new AnnotationSession(mockImages);
  session.applyZoomIn();
  assert.strictEqual(session.getZoomLevel(), 1.25);
});

test("zoom out no baja de un límite razonable", () => {
  const session = new AnnotationSession(mockImages);
  session.applyZoomOut();
  assert.ok(session.getZoomLevel() > 0);
});

test("la sesión inicia en la primera imagen", () => {
  const session = new AnnotationSession(mockImages);
  assert.strictEqual(session.getCurrentImageView()?.id, "image-1");
});

test("next avanza a la siguiente imagen", () => {
  const session = new AnnotationSession(mockImages);
  session.nextImage();
  assert.strictEqual(session.getCurrentImageView()?.id, "image-2");
});

test("next puede avanzar varias veces", () => {
  const session = new AnnotationSession(mockImages);
  session.nextImage();
  session.nextImage();
  assert.strictEqual(session.getCurrentImageView()?.id, "image-3");
});

test("next en la última imagen no avanza", () => {
  const session = new AnnotationSession(mockImages);
  session.nextImage();
  session.nextImage();
  session.nextImage();
  assert.strictEqual(session.getCurrentImageView()?.id, "image-3");
});

test("previous regresa a la imagen anterior", () => {
  const session = new AnnotationSession(mockImages);
  session.nextImage();
  session.prevImage();
  assert.strictEqual(session.getCurrentImageView()?.id, "image-1");
});

test("previous en la primera imagen no retrocede", () => {
  const session = new AnnotationSession(mockImages);
  session.prevImage();
  assert.strictEqual(session.getCurrentImageView()?.id, "image-1");
});

test("zoom no modifica la imagen actual", () => {
  const session = new AnnotationSession(mockImages);
  session.applyZoomIn();
  assert.strictEqual(session.getCurrentImageView()?.id, "image-1");
});
