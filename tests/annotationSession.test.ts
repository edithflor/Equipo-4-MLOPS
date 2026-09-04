import assert from "node:assert/strict";
import test from "node:test";
import { AnnotationSession } from "../src/logic/annotationSession";

test("la sesión inicia con zoom 1", () => {
  const session = new AnnotationSession([
    "image-1",
  ]);

  assert.equal(session.zoom, 1);
});

test("zoom in aumenta el nivel", () => {
  const session = new AnnotationSession([
    "image-1",
  ]);

  session.zoomIn();

  assert.equal(session.zoom, 1.25);
});

test("zoom out no baja de 1", () => {
  const session = new AnnotationSession([
    "image-1",
  ]);

  session.zoomOut();
  session.zoomOut();
  session.zoomOut();

  assert.equal(session.zoom, 1);
});

test("la sesión inicia en la primera imagen", () => {
  const session = new AnnotationSession([
    "image-1",
    "image-2",
    "image-3",
  ]);

  assert.equal(
    session.currentImageId,
    "image-1",
  );
});

test("next avanza a la siguiente imagen", () => {
  const session = new AnnotationSession([
    "image-1",
    "image-2",
    "image-3",
  ]);

  const result = session.next();

  assert.equal(
    result.imageId,
    "image-2",
  );

  assert.equal(
    result.atEnd,
    false,
  );
});

test("next puede avanzar varias veces", () => {
  const session = new AnnotationSession([
    "image-1",
    "image-2",
    "image-3",
  ]);

  session.next();
  session.next();

  assert.equal(
    session.currentImageId,
    "image-3",
  );
});

test("next en la última imagen no avanza", () => {
  const session = new AnnotationSession([
    "image-1",
    "image-2",
  ]);

  session.next();

  const result = session.next();

  assert.equal(
    result.imageId,
    "image-2",
  );

  assert.equal(
    result.atEnd,
    true,
  );
});

test("previous regresa a la imagen anterior", () => {
  const session = new AnnotationSession([
    "image-1",
    "image-2",
  ]);

  session.next();

  const imageId =
    session.previous();

  assert.equal(
    imageId,
    "image-1",
  );
});

test("previous en la primera imagen no retrocede", () => {
  const session = new AnnotationSession([
    "image-1",
    "image-2",
  ]);

  const imageId =
    session.previous();

  assert.equal(
    imageId,
    "image-1",
  );
});

test("zoom no modifica la imagen actual", () => {
  const session = new AnnotationSession([
    "image-1",
    "image-2",
  ]);

  session.zoomIn();

  assert.equal(
    session.currentImageId,
    "image-1",
  );
});