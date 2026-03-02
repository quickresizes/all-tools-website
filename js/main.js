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

const qualityUploadInput = document.getElementById("quality-image-upload");
const qualityRangeInput = document.getElementById("quality-range");
const qualityValueLabel = document.getElementById("quality-value");
const qualityCompressButton = document.getElementById("quality-compress-button");
const qualityDownloadButton = document.getElementById("quality-download-button");
const qualityPreviewImage = document.getElementById("quality-preview");
const qualityCanvas = document.getElementById("quality-canvas");
const qualityOriginalSize = document.getElementById("original-size");
const qualityCompressedSize = document.getElementById("compressed-size");
const qualityMessage = document.getElementById("quality-message");

let qualitySourceImage = null;
let qualityFileName = "compressed-image";
let qualityCompressedDataUrl = "";

const setQualityMessage = (message) => {
  if (qualityMessage) {
    qualityMessage.textContent = message;
  }
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
};

const estimateBase64FileSize = (dataUrl) => {
  const base64Part = dataUrl.split(",")[1] || "";
  const padding = (base64Part.match(/=+$/) || [""])[0].length;
  return Math.floor((base64Part.length * 3) / 4) - padding;
};

qualityRangeInput?.addEventListener("input", () => {
  if (qualityValueLabel) {
    qualityValueLabel.textContent = `${qualityRangeInput.value}%`;
  }
});

qualityUploadInput?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setQualityMessage("Please upload a valid image file.");
    return;
  }

  qualityFileName = file.name.replace(/\.[^.]+$/, "") || "compressed-image";

  if (qualityOriginalSize) {
    qualityOriginalSize.textContent = formatFileSize(file.size);
  }

  if (qualityCompressedSize) {
    qualityCompressedSize.textContent = "-";
  }

  qualityCompressedDataUrl = "";
  if (qualityDownloadButton) qualityDownloadButton.disabled = true;

  const reader = new FileReader();
  reader.onload = () => {
    const loadedImage = new Image();
    loadedImage.onload = () => {
      qualitySourceImage = loadedImage;
      setQualityMessage("Image uploaded. Choose a quality level and click Compress Image.");
    };
    loadedImage.src = reader.result;
  };

  reader.readAsDataURL(file);
});

qualityCompressButton?.addEventListener("click", () => {
  if (!qualitySourceImage || !qualityCanvas || !qualityRangeInput) {
    setQualityMessage("Please upload an image first.");
    return;
  }

  const context = qualityCanvas.getContext("2d");
  qualityCanvas.width = qualitySourceImage.width;
  qualityCanvas.height = qualitySourceImage.height;
  context.clearRect(0, 0, qualityCanvas.width, qualityCanvas.height);
  context.drawImage(qualitySourceImage, 0, 0);

  const qualityLevel = Number.parseInt(qualityRangeInput.value, 10) / 100;
  qualityCompressedDataUrl = qualityCanvas.toDataURL("image/jpeg", qualityLevel);

  if (qualityPreviewImage) {
    qualityPreviewImage.src = qualityCompressedDataUrl;
    qualityPreviewImage.hidden = false;
  }

  if (qualityCompressedSize) {
    qualityCompressedSize.textContent = formatFileSize(estimateBase64FileSize(qualityCompressedDataUrl));
  }

  if (qualityDownloadButton) {
    qualityDownloadButton.disabled = false;
  }

  setQualityMessage("Compression complete! Preview your image and download it.");
});

qualityDownloadButton?.addEventListener("click", () => {
  if (!qualityCompressedDataUrl) {
    return;
  }

  const downloadLink = document.createElement("a");
  downloadLink.href = qualityCompressedDataUrl;
  downloadLink.download = `${qualityFileName}-compressed.jpg`;
  downloadLink.click();
});

const rotateUploadInput = document.getElementById("rotate-image-upload");
const rotateLeftButton = document.getElementById("rotate-left-button");
const rotateRightButton = document.getElementById("rotate-right-button");
const flipHorizontalButton = document.getElementById("flip-horizontal-button");
const flipVerticalButton = document.getElementById("flip-vertical-button");
const customAngleInput = document.getElementById("custom-angle");
const applyAngleButton = document.getElementById("apply-angle-button");
const zoomInButton = document.getElementById("zoom-in-button");
const zoomOutButton = document.getElementById("zoom-out-button");
const zoomLevelInput = document.getElementById("zoom-level");
const resetTransformButton = document.getElementById("reset-transform-button");
const rotateDownloadFormatSelect = document.getElementById("rotate-download-format");
const rotateDownloadButton = document.getElementById("rotate-download-button");
const rotateBeforeCanvas = document.getElementById("rotate-before-canvas");
const rotateAfterCanvas = document.getElementById("rotate-after-canvas");
const rotateMessage = document.getElementById("rotate-message");

let rotateSourceImage = null;
let rotateFileName = "rotated-image";
let rotationAngle = 0;
let scaleX = 1;
let scaleY = 1;
let zoomLevel = 1;

const rotateMimeTypes = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};

const rotateExtensions = {
  jpeg: "jpg",
  png: "png",
  webp: "webp"
};

const setRotateMessage = (message) => {
  if (rotateMessage) {
    rotateMessage.textContent = message;
  }
};

const drawImageCover = (image, canvas) => {
  if (!image || !canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  const maxPreviewWidth = 900;
  const maxPreviewHeight = 540;
  const ratio = Math.min(maxPreviewWidth / image.width, maxPreviewHeight / image.height, 1);

  const drawWidth = Math.round(image.width * ratio);
  const drawHeight = Math.round(image.height * ratio);

  canvas.width = drawWidth;
  canvas.height = drawHeight;
  context.clearRect(0, 0, drawWidth, drawHeight);
  context.drawImage(image, 0, 0, drawWidth, drawHeight);
};

const updateZoomLabel = () => {
  if (zoomLevelInput) {
    zoomLevelInput.value = String(Math.round(zoomLevel * 100));
  }
};

const renderTransformedImage = () => {
  if (!rotateSourceImage || !rotateAfterCanvas) {
    if (rotateDownloadButton) rotateDownloadButton.disabled = true;
    return;
  }

  const radians = (rotationAngle * Math.PI) / 180;
  const sine = Math.abs(Math.sin(radians));
  const cosine = Math.abs(Math.cos(radians));
  const scaledWidth = rotateSourceImage.width * zoomLevel;
  const scaledHeight = rotateSourceImage.height * zoomLevel;

  const outputWidth = Math.max(1, Math.ceil((scaledWidth * cosine) + (scaledHeight * sine)));
  const outputHeight = Math.max(1, Math.ceil((scaledWidth * sine) + (scaledHeight * cosine)));

  rotateAfterCanvas.width = outputWidth;
  rotateAfterCanvas.height = outputHeight;

  const context = rotateAfterCanvas.getContext("2d");
  context.clearRect(0, 0, outputWidth, outputHeight);
  context.translate(outputWidth / 2, outputHeight / 2);
  context.rotate(radians);
  context.scale(scaleX * zoomLevel, scaleY * zoomLevel);
  context.drawImage(rotateSourceImage, -rotateSourceImage.width / 2, -rotateSourceImage.height / 2);
  context.setTransform(1, 0, 0, 1, 0, 0);

  if (rotateDownloadButton) {
    rotateDownloadButton.disabled = false;
  }
};

const resetRotateState = () => {
  rotationAngle = 0;
  scaleX = 1;
  scaleY = 1;
  zoomLevel = 1;

  if (customAngleInput) {
    customAngleInput.value = "0";
  }

  updateZoomLabel();
};

rotateUploadInput?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setRotateMessage("Please upload a valid image file.");
    if (rotateDownloadButton) rotateDownloadButton.disabled = true;
    return;
  }

  rotateFileName = file.name.replace(/\.[^.]+$/, "") || "rotated-image";

  const reader = new FileReader();
  reader.onload = () => {
    const loadedImage = new Image();
    loadedImage.onload = () => {
      rotateSourceImage = loadedImage;
      resetRotateState();
      drawImageCover(rotateSourceImage, rotateBeforeCanvas);
      renderTransformedImage();
      setRotateMessage("Image uploaded. Use rotate, flip, zoom, or custom angle controls.");
    };
    loadedImage.src = reader.result;
  };

  reader.readAsDataURL(file);
});

rotateLeftButton?.addEventListener("click", () => {
  if (!rotateSourceImage) return;
  rotationAngle -= 90;
  if (customAngleInput) customAngleInput.value = String(rotationAngle);
  renderTransformedImage();
});

rotateRightButton?.addEventListener("click", () => {
  if (!rotateSourceImage) return;
  rotationAngle += 90;
  if (customAngleInput) customAngleInput.value = String(rotationAngle);
  renderTransformedImage();
});

flipHorizontalButton?.addEventListener("click", () => {
  if (!rotateSourceImage) return;
  scaleX *= -1;
  renderTransformedImage();
});

flipVerticalButton?.addEventListener("click", () => {
  if (!rotateSourceImage) return;
  scaleY *= -1;
  renderTransformedImage();
});

applyAngleButton?.addEventListener("click", () => {
  if (!rotateSourceImage || !customAngleInput) return;

  const userAngle = Number.parseFloat(customAngleInput.value);
  if (!Number.isFinite(userAngle)) {
    setRotateMessage("Please enter a valid angle number.");
    return;
  }

  rotationAngle = userAngle;
  renderTransformedImage();
  setRotateMessage(`Custom angle applied: ${rotationAngle}°.`);
});

zoomInButton?.addEventListener("click", () => {
  if (!rotateSourceImage) return;
  zoomLevel = Math.min(zoomLevel + 0.1, 4);
  updateZoomLabel();
  renderTransformedImage();
});

zoomOutButton?.addEventListener("click", () => {
  if (!rotateSourceImage) return;
  zoomLevel = Math.max(zoomLevel - 0.1, 0.1);
  updateZoomLabel();
  renderTransformedImage();
});

resetTransformButton?.addEventListener("click", () => {
  if (!rotateSourceImage) return;
  resetRotateState();
  renderTransformedImage();
  setRotateMessage("Image reset to original orientation and zoom.");
});

rotateDownloadButton?.addEventListener("click", () => {
  if (!rotateAfterCanvas || rotateDownloadButton.disabled) {
    return;
  }

  const selectedFormat = rotateDownloadFormatSelect?.value || "jpeg";
  const mimeType = rotateMimeTypes[selectedFormat] || "image/jpeg";
  const extension = rotateExtensions[selectedFormat] || "jpg";

  const downloadLink = document.createElement("a");
  downloadLink.href = rotateAfterCanvas.toDataURL(mimeType, 0.92);
  downloadLink.download = `${rotateFileName}-edited.${extension}`;
  downloadLink.click();
});
