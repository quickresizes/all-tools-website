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

const cropUploadInput = document.getElementById("crop-image-upload");
const cropXInput = document.getElementById("crop-x");
const cropYInput = document.getElementById("crop-y");
const cropWidthInput = document.getElementById("crop-width");
const cropHeightInput = document.getElementById("crop-height");
const cropButton = document.getElementById("crop-button");
const cropDownloadButton = document.getElementById("crop-download-button");
const cropCanvas = document.getElementById("crop-canvas");
const cropMessage = document.getElementById("crop-message");

let cropSourceImage = null;
let cropFileName = "cropped-image";

const setCropMessage = (message) => {
  if (cropMessage) {
    cropMessage.textContent = message;
  }
};

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

const cropImageOnCanvas = () => {
  if (!cropSourceImage || !cropCanvas || !cropXInput || !cropYInput || !cropWidthInput || !cropHeightInput) {
    return;
  }

  const rawX = Number.parseInt(cropXInput.value, 10);
  const rawY = Number.parseInt(cropYInput.value, 10);
  const rawWidth = Number.parseInt(cropWidthInput.value, 10);
  const rawHeight = Number.parseInt(cropHeightInput.value, 10);

  if (!Number.isInteger(rawX) || !Number.isInteger(rawY) || !Number.isInteger(rawWidth) || !Number.isInteger(rawHeight)) {
    setCropMessage("Please enter valid whole numbers for crop values.");
    if (cropDownloadButton) cropDownloadButton.disabled = true;
    return;
  }

  const cropX = clampNumber(rawX, 0, cropSourceImage.width - 1);
  const cropY = clampNumber(rawY, 0, cropSourceImage.height - 1);
  const maxWidth = cropSourceImage.width - cropX;
  const maxHeight = cropSourceImage.height - cropY;
  const cropWidth = clampNumber(rawWidth, 1, maxWidth);
  const cropHeight = clampNumber(rawHeight, 1, maxHeight);

  cropXInput.value = String(cropX);
  cropYInput.value = String(cropY);
  cropWidthInput.value = String(cropWidth);
  cropHeightInput.value = String(cropHeight);

  const context = cropCanvas.getContext("2d");
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  context.clearRect(0, 0, cropWidth, cropHeight);
  context.drawImage(cropSourceImage, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  if (cropDownloadButton) {
    cropDownloadButton.disabled = false;
  }

  setCropMessage(`Done! Cropped area: ${cropWidth} × ${cropHeight}px from (${cropX}, ${cropY}).`);
};

cropUploadInput?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setCropMessage("Please upload a valid image file.");
    if (cropDownloadButton) cropDownloadButton.disabled = true;
    return;
  }

  cropFileName = file.name.replace(/\.[^.]+$/, "") || "cropped-image";

  const reader = new FileReader();
  reader.onload = () => {
    const loadedImage = new Image();
    loadedImage.onload = () => {
      cropSourceImage = loadedImage;

      if (cropXInput) cropXInput.value = "0";
      if (cropYInput) cropYInput.value = "0";
      if (cropWidthInput) cropWidthInput.value = String(loadedImage.width);
      if (cropHeightInput) cropHeightInput.value = String(loadedImage.height);

      cropImageOnCanvas();
      setCropMessage("Image uploaded. Adjust values if needed, then click Crop Image.");
    };

    loadedImage.src = reader.result;
  };

  reader.readAsDataURL(file);
});

cropButton?.addEventListener("click", () => {
  if (!cropSourceImage) {
    setCropMessage("Please upload an image first.");
    return;
  }

  cropImageOnCanvas();
});

cropDownloadButton?.addEventListener("click", () => {
  if (!cropCanvas || cropDownloadButton.disabled) {
    return;
  }

  const downloadLink = document.createElement("a");
  downloadLink.href = cropCanvas.toDataURL("image/png");
  downloadLink.download = `${cropFileName}-cropped.png`;
  downloadLink.click();
});

const converterUploadInput = document.getElementById("converter-upload");
const converterFormatSelect = document.getElementById("converter-format");
const converterButton = document.getElementById("converter-button");
const converterDownloadButton = document.getElementById("converter-download-button");
const converterCanvas = document.getElementById("converter-canvas");
const converterMessage = document.getElementById("converter-message");

let converterSourceImage = null;
let converterFileName = "converted-image";
let converterLastMimeType = "image/jpeg";
let converterLastExtension = "jpg";

const formatToMimeType = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};

const formatToExtension = {
  jpeg: "jpg",
  png: "png",
  webp: "webp"
};

const setConverterMessage = (message) => {
  if (converterMessage) {
    converterMessage.textContent = message;
  }
};

const convertImageOnCanvas = () => {
  if (!converterSourceImage || !converterCanvas || !converterFormatSelect) {
    return;
  }

  const selectedFormat = converterFormatSelect.value;
  const mimeType = formatToMimeType[selectedFormat] || "image/jpeg";
  const extension = formatToExtension[selectedFormat] || "jpg";
  const context = converterCanvas.getContext("2d");

  converterCanvas.width = converterSourceImage.width;
  converterCanvas.height = converterSourceImage.height;
  context.clearRect(0, 0, converterCanvas.width, converterCanvas.height);
  context.drawImage(converterSourceImage, 0, 0);

  converterLastMimeType = mimeType;
  converterLastExtension = extension;

  if (converterDownloadButton) {
    converterDownloadButton.disabled = false;
  }

  setConverterMessage(`Done! Your image is ready as ${extension.toUpperCase()}.`);
};

converterUploadInput?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setConverterMessage("Please upload a valid image file.");
    if (converterDownloadButton) converterDownloadButton.disabled = true;
    return;
  }

  converterFileName = file.name.replace(/\.[^.]+$/, "") || "converted-image";

  const reader = new FileReader();
  reader.onload = () => {
    const loadedImage = new Image();
    loadedImage.onload = () => {
      converterSourceImage = loadedImage;
      convertImageOnCanvas();
    };
    loadedImage.src = reader.result;
  };

  reader.readAsDataURL(file);
});

converterButton?.addEventListener("click", () => {
  if (!converterSourceImage) {
    setConverterMessage("Please upload an image first.");
    return;
  }

  convertImageOnCanvas();
});

converterDownloadButton?.addEventListener("click", () => {
  if (!converterCanvas || converterDownloadButton.disabled) {
    return;
  }

  const downloadLink = document.createElement("a");
  downloadLink.href = converterCanvas.toDataURL(converterLastMimeType, 0.92);
  downloadLink.download = `${converterFileName}-converted.${converterLastExtension}`;
  downloadLink.click();
});
