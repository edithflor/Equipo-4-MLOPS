const form = document.querySelector("#upload-form");
const input = document.querySelector("#image-input");
const button = document.querySelector("#upload-button");
const statusMessage = document.querySelector("#status-message");
const imageList = document.querySelector("#image-list");
const imageCount = document.querySelector("#image-count");
const categoryList = document.querySelector("#category-list");
const categoryMessage = document.querySelector("#category-message");
const selectedCategoryLabel = document.querySelector("#selected-category-label");

let categories = [];
let selectedCategory = null;

function setStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

function setCategoryMessage(message, type) {
  categoryMessage.textContent = message;
  categoryMessage.className = `status-message ${type}`;
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

    const prepareButton = document.createElement("button");
    prepareButton.type = "button";
    prepareButton.className = "prepare-annotation-button";
    prepareButton.textContent = "Preparar caja";
    prepareButton.addEventListener("click", () => {
      if (!selectedCategory) {
        setCategoryMessage("Selecciona una categoría antes de crear una caja.", "error");
        return;
      }

      card.style.borderColor = selectedCategory.color;
      setCategoryMessage(
        `Caja preparada para ${image.filename} con categoría ${selectedCategory.name}.`,
        "success",
      );
    });

    meta.append(filename, details);
    card.append(preview, meta, prepareButton);
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

async function loadCategories() {
  const response = await fetch("/categories");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "No se pudieron cargar las categorías.");
  }

  renderCategories(payload);
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

loadCategories().catch((error) => {
  const message = error instanceof Error ? error.message : "No se pudieron cargar las categorías.";
  setCategoryMessage(message, "error");
});
