import { displayToImageBox, imageToDisplayBox } from "./coordinateTransforms.js";

const form = document.querySelector("#upload-form");
const input = document.querySelector("#image-input");
const button = document.querySelector("#upload-button");
const statusMessage = document.querySelector("#status-message");
const imageList = document.querySelector("#image-list");
const imageCount = document.querySelector("#image-count");
const metricsGrid = document.querySelector("#dashboard-metrics");
const metricsMessage = document.querySelector("#metrics-message");
const refreshMetricsButton = document.querySelector("#refresh-metrics-button");
const objectsByCategoryChart = document.querySelector("#objects-by-category-chart");
const annotationProgressChart = document.querySelector("#annotation-progress-chart");
const categoryList = document.querySelector("#category-list");
const categoryMessage = document.querySelector("#category-message");
const selectedCategoryLabel = document.querySelector("#selected-category-label");
const annotationStage = document.querySelector("#annotation-stage");
const annotationMessage = document.querySelector("#annotation-message");
const deleteBoxButton = document.querySelector("#delete-box-button");
const previousImageButton = document.querySelector("#previous-image-button");
const nextImageButton = document.querySelector("#next-image-button");
const saveNextButton = document.querySelector("#save-next-button");
const zoomOutButton = document.querySelector("#zoom-out-button");
const zoomInButton = document.querySelector("#zoom-in-button");
const undoButton = document.querySelector("#undo-button");
const zoomLabel = document.querySelector("#zoom-label");
const imagePositionLabel = document.querySelector("#image-position-label");

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const BASE_CANVAS_WIDTH = 720;

let images = [];
let categories = [];
let selectedImage = null;
let selectedImageIndex = -1;
let selectedCategory = null;
let annotations = [];
let selectedAnnotationId = null;
let canvasImage = null;
let canvasLayer = null;
let activePointer = null;
let zoomLevel = 1;
let historyStack = [];

function setStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

function setCategoryMessage(message, type) {
  categoryMessage.textContent = message;
  categoryMessage.className = `status-message ${type}`;
}

function setMetricsMessage(message, type) {
  metricsMessage.textContent = message;
  metricsMessage.className = `status-message ${type}`;
}

function setAnnotationMessage(message, type) {
  annotationMessage.textContent = message;
  annotationMessage.className = `status-message ${type}`;
}

function updateControls() {
  const hasImage = selectedImage !== null;
  const atFirstImage = selectedImageIndex <= 0;
  const atLastImage = selectedImageIndex >= images.length - 1;

  previousImageButton.disabled = !hasImage || images.length === 0;
  nextImageButton.disabled = !hasImage || images.length === 0;
  saveNextButton.disabled = !hasImage || images.length === 0;
  zoomOutButton.disabled = !hasImage || zoomLevel <= MIN_ZOOM;
  zoomInButton.disabled = !hasImage || zoomLevel >= MAX_ZOOM;
  undoButton.disabled = historyStack.length === 0;
  imagePositionLabel.textContent = hasImage
    ? `${selectedImageIndex + 1} de ${images.length}`
    : "Sin imagen";

  previousImageButton.dataset.boundary = String(atFirstImage);
  nextImageButton.dataset.boundary = String(atLastImage);
  saveNextButton.dataset.boundary = String(atLastImage);
}

function pushHistory(action) {
  historyStack.push(action);
  updateControls();
}

function clearHistory() {
  historyStack = [];
  updateControls();
}

function applyZoom() {
  zoomLevel = Math.min(Math.max(zoomLevel, MIN_ZOOM), MAX_ZOOM);
  zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;

  const canvas = canvasImage?.closest(".annotation-canvas");
  if (canvas) {
    canvas.style.width = `${BASE_CANVAS_WIDTH * zoomLevel}px`;
  }

  renderAnnotations();
  updateControls();
}

function updateSelectedCategory(category) {
  selectedCategory = category;
  selectedCategoryLabel.textContent = category ? category.name : "Sin categoría";

  for (const option of categoryList.querySelectorAll(".category-option")) {
    const isSelected = category !== null && option.dataset.categoryId === String(category.id);
    option.setAttribute("aria-checked", String(isSelected));
    option.classList.toggle("selected", isSelected);
  }
}

function formatBytes(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

function formatCount(value) {
  return new Intl.NumberFormat("es-MX").format(value);
}

function getCategory(categoryId) {
  return categories.find((category) => category.id === categoryId);
}

function getImageMetrics() {
  if (!canvasImage) {
    throw new Error("No hay imagen seleccionada.");
  }

  const rect = canvasImage.getBoundingClientRect();
  return {
    naturalWidth: canvasImage.naturalWidth,
    naturalHeight: canvasImage.naturalHeight,
    displayWidth: rect.width,
    displayHeight: rect.height,
  };
}

function getPointerPosition(event) {
  const rect = canvasImage.getBoundingClientRect();
  return {
    x: Math.min(Math.max(event.clientX - rect.left, 0), rect.width),
    y: Math.min(Math.max(event.clientY - rect.top, 0), rect.height),
  };
}

function normalizeDisplayBox(start, end) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function selectAnnotation(id) {
  selectedAnnotationId = id;
  deleteBoxButton.disabled = !id;

  for (const box of annotationStage.querySelectorAll(".bbox")) {
    box.classList.toggle("selected", box.dataset.annotationId === id);
  }
}

function renderCategories(nextCategories) {
  categories = nextCategories;
  categoryList.replaceChildren();

  if (categories.length === 0) {
    setCategoryMessage("No hay categorías disponibles.", "error");
    updateSelectedCategory(null);
    return;
  }

  for (const category of categories) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "category-option";
    option.dataset.categoryId = String(category.id);
    option.setAttribute("role", "radio");
    option.setAttribute("aria-checked", "false");
    option.style.setProperty("--category-color", category.color);

    const swatch = document.createElement("span");
    swatch.className = "category-swatch";
    swatch.style.backgroundColor = category.color;

    const name = document.createElement("span");
    name.textContent = category.name;

    option.append(swatch, name);
    option.addEventListener("click", () => {
      updateSelectedCategory(category);
      setCategoryMessage(`Categoría seleccionada: ${category.name}.`, "success");
    });
    categoryList.append(option);
  }
}

function renderImages(nextImages) {
  images = nextImages;
  imageCount.textContent = String(images.length);
  imageList.replaceChildren();

  if (images.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Todavía no hay imágenes cargadas.";
    imageList.append(emptyState);
    return;
  }

  for (const image of images) {
    const card = document.createElement("article");
    card.className = "image-card";
    card.dataset.imageId = image.id;

    if (selectedImage?.id === image.id) {
      card.classList.add("selected");
    }

    const preview = document.createElement("img");
    preview.src = image.url;
    preview.alt = `Imagen ${image.filename} lista para anotar`;

    const meta = document.createElement("div");
    meta.className = "image-meta";

    const filename = document.createElement("strong");
    filename.textContent = image.filename;

    const details = document.createElement("span");
    details.textContent = `${image.mimetype} · ${formatBytes(image.size)}`;

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "prepare-annotation-button";
    selectButton.textContent = "Seleccionar para anotar";
    selectButton.addEventListener("click", () => {
      selectImage(image).catch((error) => {
        const message =
          error instanceof Error ? error.message : "No se pudo seleccionar la imagen.";
        setAnnotationMessage(message, "error");
      });
    });

    meta.append(filename, details);
    card.append(preview, meta, selectButton);
    imageList.append(card);
  }

  updateControls();
}

function renderObjectsByCategory(objectsByCategory) {
  objectsByCategoryChart.replaceChildren();

  if (objectsByCategory.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Sin objetos anotados.";
    objectsByCategoryChart.append(emptyState);
    return;
  }

  const maxCount = Math.max(...objectsByCategory.map((category) => category.count));

  for (const category of objectsByCategory) {
    const row = document.createElement("article");
    row.className = "category-bar-row";
    row.style.setProperty("--category-color", category.categoryColor);

    const label = document.createElement("span");
    label.className = "category-bar-label";
    label.textContent = category.categoryName;

    const track = document.createElement("span");
    track.className = "category-bar-track";

    const bar = document.createElement("span");
    bar.className = "category-bar-fill";
    bar.style.width = `${(category.count / maxCount) * 100}%`;

    const value = document.createElement("strong");
    value.className = "category-bar-value";
    value.textContent = formatCount(category.count);

    track.append(bar);
    row.append(label, track, value);
    objectsByCategoryChart.append(row);
  }
}

function renderAnnotationProgress(annotationProgress) {
  const totalImages = annotationProgress.totalImages;
  const annotatedPercent =
    totalImages === 0 ? 0 : (annotationProgress.annotated / totalImages) * 100;
  const pendingPercent = totalImages === 0 ? 0 : (annotationProgress.pending / totalImages) * 100;

  annotationProgressChart.style.setProperty("--annotated-percent", `${annotatedPercent}%`);
  annotationProgressChart.style.setProperty("--pending-percent", `${pendingPercent}%`);
  annotationProgressChart.querySelector("[data-progress-annotated-label]").textContent =
    formatCount(annotationProgress.annotated);
  annotationProgressChart.querySelector("[data-progress-pending-label]").textContent = formatCount(
    annotationProgress.pending,
  );
}

function renderAnnotation(annotation) {
  const category = getCategory(annotation.categoryId);
  const color = category?.color || "#1f7a8c";
  const displayBox = imageToDisplayBox(annotation, getImageMetrics());

  const box = document.createElement("div");
  box.className = "bbox";
  box.dataset.annotationId = annotation.id;
  box.style.setProperty("--category-color", color);
  box.style.left = `${displayBox.x}px`;
  box.style.top = `${displayBox.y}px`;
  box.style.width = `${displayBox.width}px`;
  box.style.height = `${displayBox.height}px`;

  const label = document.createElement("span");
  label.className = "bbox-label";
  label.textContent = category?.name || "Categoría";

  const handle = document.createElement("span");
  handle.className = "bbox-handle";
  handle.dataset.resizeHandle = "true";

  box.append(label, handle);
  box.addEventListener("pointerdown", (event) => startExistingBoxInteraction(event, annotation));
  canvasLayer.append(box);
}

function renderAnnotations() {
  if (!canvasLayer || !canvasImage || canvasImage.naturalWidth === 0) {
    return;
  }

  canvasLayer.replaceChildren();

  for (const annotation of annotations) {
    renderAnnotation(annotation);
  }

  selectAnnotation(selectedAnnotationId);
}

async function loadAnnotations(imageId) {
  const response = await fetch(`/annotations/image/${imageId}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudieron cargar las cajas.");
  }

  annotations = payload;
  selectedAnnotationId = null;
  renderAnnotations();
}

async function selectImage(image) {
  selectedImage = image;
  selectedImageIndex = images.findIndex((item) => item.id === image.id);
  annotations = [];
  selectedAnnotationId = null;
  zoomLevel = 1;
  clearHistory();
  deleteBoxButton.disabled = true;
  renderImages(images);

  annotationStage.replaceChildren();
  const canvas = document.createElement("div");
  canvas.className = "annotation-canvas";
  canvas.style.width = `${BASE_CANVAS_WIDTH}px`;

  canvasImage = document.createElement("img");
  canvasImage.className = "annotation-image";
  canvasImage.src = image.url;
  canvasImage.alt = `Anotando ${image.filename}`;

  canvasLayer = document.createElement("div");
  canvasLayer.className = "annotation-layer";

  canvas.append(canvasImage, canvasLayer);
  annotationStage.append(canvas);
  setAnnotationMessage(`Imagen seleccionada: ${image.filename}.`, "success");
  applyZoom();
  updateControls();

  canvasImage.addEventListener("load", () => {
    applyZoom();
    renderAnnotations();
  });

  canvas.addEventListener("pointerdown", startCreateBox);
  await loadAnnotations(image.id);
}

async function goToImage(nextIndex) {
  if (images.length === 0) {
    setAnnotationMessage("No hay imágenes para navegar.", "error");
    return false;
  }

  if (nextIndex < 0) {
    setAnnotationMessage("Ya estás en la primera imagen.", "error");
    return false;
  }

  if (nextIndex >= images.length) {
    setAnnotationMessage("Ya estás en la última imagen.", "error");
    return false;
  }

  await selectImage(images[nextIndex]);
  return true;
}

async function loadImages() {
  const response = await fetch("/images");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudieron cargar las imágenes.");
  }

  renderImages(payload.images);
}

async function loadCategories() {
  const response = await fetch("/categories");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudieron cargar las categorías.");
  }

  renderCategories(payload);
}

async function loadDashboardMetrics() {
  const response = await fetch("/dashboard/metrics");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudieron cargar las métricas.");
  }

  for (const metric of metricsGrid.querySelectorAll("[data-metric-key]")) {
    const key = metric.dataset.metricKey;
    const value = metric.querySelector("[data-metric-value]");

    if (value && Object.hasOwn(payload, key)) {
      value.textContent = formatCount(payload[key]);
    }
  }

  renderObjectsByCategory(payload.objectsByCategory);
  renderAnnotationProgress(payload.annotationProgress);
  setMetricsMessage("Métricas actualizadas desde la base de datos.", "success");
}

async function createAnnotation(displayBox) {
  if (!selectedImage || !selectedCategory) {
    throw new Error("Selecciona una imagen y una categoría antes de crear una caja.");
  }

  const imageBox = displayToImageBox(displayBox, getImageMetrics());
  const response = await fetch("/annotations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageId: selectedImage.id,
      categoryId: selectedCategory.id,
      ...imageBox,
    }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo guardar la caja.");
  }

  annotations.push(payload);
  selectedAnnotationId = payload.id;
  pushHistory({
    type: "create",
    annotationId: payload.id,
    undo: async () => {
      await deleteAnnotation(payload.id);
      annotations = annotations.filter((annotation) => annotation.id !== payload.id);
      selectAnnotation(null);
      renderAnnotations();
    },
  });
  renderAnnotations();
}

async function persistAnnotationGeometry(annotation, imageBox) {
  const response = await fetch(`/annotations/${annotation.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(imageBox),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo actualizar la caja.");
  }

  Object.assign(annotation, imageBox);
  selectedAnnotationId = annotation.id;
  renderAnnotations();
}

async function updateAnnotationGeometry(annotation, displayBox, previousGeometry) {
  const imageBox = displayToImageBox(displayBox, getImageMetrics());
  await persistAnnotationGeometry(annotation, imageBox);

  if (previousGeometry) {
    pushHistory({
      type: "update",
      annotationId: annotation.id,
      undo: async () => {
        await persistAnnotationGeometry(annotation, previousGeometry);
      },
    });
  }
}

async function deleteAnnotation(annotationId) {
  const response = await fetch(`/annotations/${annotationId}`, { method: "DELETE" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo eliminar la caja.");
  }
}

function startCreateBox(event) {
  if (event.target !== canvasImage && event.target !== event.currentTarget) {
    return;
  }

  if (!selectedImage) {
    setAnnotationMessage("Selecciona una imagen antes de dibujar.", "error");
    return;
  }

  if (!selectedCategory) {
    setAnnotationMessage("Selecciona una categoría antes de crear una caja.", "error");
    return;
  }

  event.preventDefault();
  const pointerId = event.pointerId;
  const start = getPointerPosition(event);
  const previewBox = document.createElement("div");
  previewBox.className = "bbox selected";
  previewBox.style.setProperty("--category-color", selectedCategory.color);
  canvasLayer.append(previewBox);

  activePointer = {
    type: "create",
    pointerId,
    start,
    previewBox,
  };

  annotationStage.setPointerCapture(pointerId);
}

function startExistingBoxInteraction(event, annotation) {
  event.preventDefault();
  event.stopPropagation();

  const pointerId = event.pointerId;
  const start = getPointerPosition(event);
  const startBox = imageToDisplayBox(annotation, getImageMetrics());
  const isResize =
    event.target instanceof HTMLElement && event.target.dataset.resizeHandle === "true";

  selectAnnotation(annotation.id);
  activePointer = {
    type: isResize ? "resize" : "move",
    pointerId,
    annotation,
    start,
    startBox,
    previousGeometry: {
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: annotation.height,
    },
  };

  annotationStage.setPointerCapture(pointerId);
}

function updatePreviewBox(box, displayBox) {
  box.style.left = `${displayBox.x}px`;
  box.style.top = `${displayBox.y}px`;
  box.style.width = `${displayBox.width}px`;
  box.style.height = `${displayBox.height}px`;
}

annotationStage.addEventListener("pointermove", (event) => {
  if (!activePointer || activePointer.pointerId !== event.pointerId) {
    return;
  }

  const current = getPointerPosition(event);

  if (activePointer.type === "create") {
    updatePreviewBox(activePointer.previewBox, normalizeDisplayBox(activePointer.start, current));
    return;
  }

  const deltaX = current.x - activePointer.start.x;
  const deltaY = current.y - activePointer.start.y;
  const nextBox =
    activePointer.type === "move"
      ? {
          ...activePointer.startBox,
          x: Math.max(0, activePointer.startBox.x + deltaX),
          y: Math.max(0, activePointer.startBox.y + deltaY),
        }
      : {
          ...activePointer.startBox,
          width: Math.max(4, activePointer.startBox.width + deltaX),
          height: Math.max(4, activePointer.startBox.height + deltaY),
        };

  const box = canvasLayer.querySelector(`[data-annotation-id="${activePointer.annotation.id}"]`);

  if (box) {
    updatePreviewBox(box, nextBox);
  }
});

annotationStage.addEventListener("pointerup", (event) => {
  if (!activePointer || activePointer.pointerId !== event.pointerId) {
    return;
  }

  const pointerState = activePointer;
  activePointer = null;
  annotationStage.releasePointerCapture(event.pointerId);

  const current = getPointerPosition(event);

  if (pointerState.type === "create") {
    const displayBox = normalizeDisplayBox(pointerState.start, current);
    pointerState.previewBox.remove();

    if (displayBox.width < 4 || displayBox.height < 4) {
      setAnnotationMessage("Dibuja una caja de al menos 4 píxeles.", "error");
      return;
    }

    createAnnotation(displayBox)
      .then(() => setAnnotationMessage("Caja creada y guardada.", "success"))
      .catch((error) => {
        const message = error instanceof Error ? error.message : "No se pudo guardar la caja.";
        setAnnotationMessage(message, "error");
      });
    return;
  }

  const deltaX = current.x - pointerState.start.x;
  const deltaY = current.y - pointerState.start.y;
  const displayBox =
    pointerState.type === "move"
      ? {
          ...pointerState.startBox,
          x: Math.max(0, pointerState.startBox.x + deltaX),
          y: Math.max(0, pointerState.startBox.y + deltaY),
        }
      : {
          ...pointerState.startBox,
          width: Math.max(4, pointerState.startBox.width + deltaX),
          height: Math.max(4, pointerState.startBox.height + deltaY),
        };

  updateAnnotationGeometry(pointerState.annotation, displayBox, pointerState.previousGeometry)
    .then(() => setAnnotationMessage("Caja actualizada y guardada.", "success"))
    .catch((error) => {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la caja.";
      setAnnotationMessage(message, "error");
      renderAnnotations();
    });
});

deleteBoxButton.addEventListener("click", async () => {
  if (!selectedAnnotationId) {
    setAnnotationMessage("Selecciona una caja para eliminar.", "error");
    return;
  }

  try {
    await deleteAnnotation(selectedAnnotationId);

    annotations = annotations.filter((annotation) => annotation.id !== selectedAnnotationId);
    selectAnnotation(null);
    clearHistory();
    renderAnnotations();
    setAnnotationMessage("Caja eliminada.", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar la caja.";
    setAnnotationMessage(message, "error");
  }
});

previousImageButton.addEventListener("click", () => {
  goToImage(selectedImageIndex - 1).catch((error) => {
    const message = error instanceof Error ? error.message : "No se pudo cambiar de imagen.";
    setAnnotationMessage(message, "error");
  });
});

nextImageButton.addEventListener("click", () => {
  goToImage(selectedImageIndex + 1).catch((error) => {
    const message = error instanceof Error ? error.message : "No se pudo cambiar de imagen.";
    setAnnotationMessage(message, "error");
  });
});

saveNextButton.addEventListener("click", () => {
  if (activePointer) {
    setAnnotationMessage("Termina la edición actual antes de avanzar.", "error");
    return;
  }

  goToImage(selectedImageIndex + 1)
    .then((changedImage) => {
      if (changedImage) {
        setAnnotationMessage("Anotaciones guardadas. Siguiente imagen lista.", "success");
      }
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "No se pudo avanzar.";
      setAnnotationMessage(message, "error");
    });
});

zoomOutButton.addEventListener("click", () => {
  zoomLevel -= ZOOM_STEP;
  applyZoom();
  setAnnotationMessage("Zoom actualizado solo en la vista.", "success");
});

zoomInButton.addEventListener("click", () => {
  zoomLevel += ZOOM_STEP;
  applyZoom();
  setAnnotationMessage("Zoom actualizado solo en la vista.", "success");
});

undoButton.addEventListener("click", async () => {
  const action = historyStack.pop();

  if (!action) {
    setAnnotationMessage("No hay acciones para deshacer.", "error");
    updateControls();
    return;
  }

  try {
    await action.undo();
    renderAnnotations();
    setAnnotationMessage("Última acción deshecha y persistida.", "success");
  } catch (error) {
    historyStack.push(action);
    const message = error instanceof Error ? error.message : "No se pudo deshacer la acción.";
    setAnnotationMessage(message, "error");
  } finally {
    updateControls();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!input.files || input.files.length === 0) {
    setStatus("Selecciona una imagen antes de cargar.", "error");
    return;
  }

  const body = new FormData();
  body.append("image", input.files[0]);

  button.disabled = true;
  setStatus("Cargando imagen...", "");

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body,
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "El servidor rechazó la imagen.");
    }

    setStatus("Imagen cargada correctamente.", "success");
    input.value = "";
    await loadImages();
    await loadDashboardMetrics();
    const uploadedImage = images.find((image) => image.id === payload.imageId);

    if (uploadedImage) {
      await selectImage(uploadedImage);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de red al cargar la imagen.";
    setStatus(message, "error");
  } finally {
    button.disabled = false;
  }
});

refreshMetricsButton.addEventListener("click", () => {
  loadDashboardMetrics().catch((error) => {
    const message = error instanceof Error ? error.message : "No se pudieron cargar las métricas.";
    setMetricsMessage(message, "error");
  });
});

loadImages().catch((error) => {
  const message = error instanceof Error ? error.message : "No se pudieron cargar las imágenes.";
  setStatus(message, "error");
});

loadDashboardMetrics().catch((error) => {
  const message = error instanceof Error ? error.message : "No se pudieron cargar las métricas.";
  setMetricsMessage(message, "error");
});

loadCategories().catch((error) => {
  const message = error instanceof Error ? error.message : "No se pudieron cargar las categorías.";
  setCategoryMessage(message, "error");
});

updateControls();
