const themeToggle = document.querySelector(".theme-toggle");
const storedTheme = localStorage.getItem("mediatools-theme");

if (storedTheme === "dark") {
  document.body.classList.add("dark");
}

const updateThemeButton = () => {
  if (!themeToggle) return;

  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  themeToggle.setAttribute("aria-pressed", String(isDark));
};

updateThemeButton();

themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "mediatools-theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
  updateThemeButton();
});

const searchInput = document.getElementById("tool-search");
const toolCards = document.querySelectorAll(".tool-card");
const categories = document.querySelectorAll(".tool-category");
const noResults = document.getElementById("no-results");

const filterTools = (query) => {
  let visibleCount = 0;

  toolCards.forEach((card) => {
    const text = (card.dataset.toolName || card.innerText).toLowerCase();
    const isVisible = text.includes(query);
    card.hidden = !isVisible;

    if (isVisible) {
      visibleCount += 1;
    }
  });

  categories.forEach((category) => {
    const visibleInCategory = category.querySelectorAll(".tool-card:not([hidden])").length;
    category.hidden = visibleInCategory === 0;
  });

  if (noResults) {
    noResults.hidden = visibleCount > 0;
  }
};

searchInput?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  filterTools(query);
});

const imageUploadInput = document.getElementById("image-upload");
const resizeWidthInput = document.getElementById("resize-width");
const resizeHeightInput = document.getElementById("resize-height");
const resizeButton = document.getElementById("resize-btn");
const downloadButton = document.getElementById("download-btn");
const previewCanvas = document.getElementById("preview-canvas");
const resizeMessage = document.getElementById("resize-message");

let originalImage = null;

const showResizeMessage = (message) => {
  if (resizeMessage) {
    resizeMessage.textContent = message;
  }
};

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load this image. Please try another one."));
    image.src = URL.createObjectURL(file);
  });

imageUploadInput?.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];

  if (!file) {
    originalImage = null;
    showResizeMessage("Please select an image file to begin.");
    downloadButton?.setAttribute("disabled", "true");
    return;
  }

  if (!file.type.startsWith("image/")) {
    originalImage = null;
    showResizeMessage("Selected file is not an image.");
    downloadButton?.setAttribute("disabled", "true");
    return;
  }

  try {
    originalImage = await loadImageFromFile(file);

    if (resizeWidthInput && !resizeWidthInput.value) {
      resizeWidthInput.value = String(originalImage.width);
    }

    if (resizeHeightInput && !resizeHeightInput.value) {
      resizeHeightInput.value = String(originalImage.height);
    }

    showResizeMessage(`Image loaded: ${originalImage.width}px × ${originalImage.height}px`);
  } catch (error) {
    originalImage = null;
    showResizeMessage(error.message);
  }
});

resizeButton?.addEventListener("click", () => {
  if (!originalImage || !previewCanvas) {
    showResizeMessage("Please upload an image first.");
    return;
  }

  const width = Number(resizeWidthInput?.value);
  const height = Number(resizeHeightInput?.value);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    showResizeMessage("Enter valid width and height values (whole numbers above 0).");
    return;
  }

  const context = previewCanvas.getContext("2d");

  if (!context) {
    showResizeMessage("Canvas is not supported in this browser.");
    return;
  }

  previewCanvas.width = width;
  previewCanvas.height = height;
  context.clearRect(0, 0, width, height);
  context.drawImage(originalImage, 0, 0, width, height);
  previewCanvas.style.display = "block";

  downloadButton?.removeAttribute("disabled");
  showResizeMessage(`Done! Image resized to ${width}px × ${height}px.`);
});

downloadButton?.addEventListener("click", () => {
  if (!previewCanvas || previewCanvas.width === 0 || previewCanvas.height === 0) {
    showResizeMessage("Please resize your image before downloading.");
    return;
  }

  const link = document.createElement("a");
  link.download = "resized-image.png";
  link.href = previewCanvas.toDataURL("image/png");
  link.click();
});
