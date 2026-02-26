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
const resizeButton = document.getElementById("resize-button");
const downloadButton = document.getElementById("download-button");
const resizerCanvas = document.getElementById("resizer-canvas");
const resizerMessage = document.getElementById("resizer-message");

let sourceImage = null;
let sourceFileName = "resized-image";

const setResizerMessage = (message) => {
  if (resizerMessage) {
    resizerMessage.textContent = message;
  }
};

const resizeImageOnCanvas = () => {
  if (!sourceImage || !resizerCanvas || !resizeWidthInput || !resizeHeightInput) {
    return;
  }

  const targetWidth = Number.parseInt(resizeWidthInput.value, 10);
  const targetHeight = Number.parseInt(resizeHeightInput.value, 10);

  if (!Number.isInteger(targetWidth) || targetWidth <= 0 || !Number.isInteger(targetHeight) || targetHeight <= 0) {
    setResizerMessage("Please enter a valid width and height greater than 0.");
    if (downloadButton) downloadButton.disabled = true;
    return;
  }

  const context = resizerCanvas.getContext("2d");
  resizerCanvas.width = targetWidth;
  resizerCanvas.height = targetHeight;
  context.clearRect(0, 0, targetWidth, targetHeight);
  context.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);

  if (downloadButton) {
    downloadButton.disabled = false;
  }

  setResizerMessage(`Done! Your image was resized to ${targetWidth} × ${targetHeight}px.`);
};

imageUploadInput?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setResizerMessage("Please upload a valid image file.");
    return;
  }

  sourceFileName = file.name.replace(/\.[^.]+$/, "") || "resized-image";

  const reader = new FileReader();
  reader.onload = () => {
    const loadedImage = new Image();
    loadedImage.onload = () => {
      sourceImage = loadedImage;

      if (resizeWidthInput && !resizeWidthInput.value) {
        resizeWidthInput.value = String(loadedImage.width);
      }

      if (resizeHeightInput && !resizeHeightInput.value) {
        resizeHeightInput.value = String(loadedImage.height);
      }

      resizeImageOnCanvas();
      setResizerMessage("Image uploaded. You can update the size and click Resize Image.");
    };

    loadedImage.src = reader.result;
  };

  reader.readAsDataURL(file);
});

resizeButton?.addEventListener("click", () => {
  if (!sourceImage) {
    setResizerMessage("Please upload an image first.");
    return;
  }

  resizeImageOnCanvas();
});

downloadButton?.addEventListener("click", () => {
  if (!resizerCanvas || downloadButton.disabled) {
    return;
  }

  const downloadLink = document.createElement("a");
  downloadLink.href = resizerCanvas.toDataURL("image/png");
  downloadLink.download = `${sourceFileName}-resized.png`;
  downloadLink.click();
});
