const form = document.querySelector("#upload-form");
const input = document.querySelector("#image-input");
const button = document.querySelector("#upload-button");
const statusMessage = document.querySelector("#status-message");
const imageList = document.querySelector("#image-list");
const imageCount = document.querySelector("#image-count");

function setStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

function formatBytes(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

function renderImages(images) {
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

    const preview = document.createElement("img");
    preview.src = image.url;
    preview.alt = `Imagen ${image.filename} lista para anotar`;

    const meta = document.createElement("div");
    meta.className = "image-meta";

    const filename = document.createElement("strong");
    filename.textContent = image.filename;

    const details = document.createElement("span");
    details.textContent = `${image.mimetype} · ${formatBytes(image.size)}`;

    meta.append(filename, details);
    card.append(preview, meta);
    imageList.append(card);
  }
}

async function loadImages() {
  const response = await fetch("/images");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudieron cargar las imágenes.");
  }

  renderImages(payload.images);
}

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de red al cargar la imagen.";
    setStatus(message, "error");
  } finally {
    button.disabled = false;
  }
});

loadImages().catch((error) => {
  const message = error instanceof Error ? error.message : "No se pudieron cargar las imágenes.";
  setStatus(message, "error");
});
