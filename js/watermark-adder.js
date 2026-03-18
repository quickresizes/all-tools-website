(() => {
  const fileInput = document.getElementById("watermark-file-upload");
  const dropzone = document.getElementById("watermark-dropzone");
  const fileList = document.getElementById("watermark-file-list");
  const fileCount = document.getElementById("watermark-file-count");
  const message = document.getElementById("watermark-message");
  const selectionSummary = document.getElementById("watermark-selection-summary");
  const previewShell = document.getElementById("watermark-preview-shell");
  const previewPlaceholder = document.getElementById("watermark-preview-placeholder");
  const previewCanvas = document.getElementById("watermark-preview-canvas");
  const beforeCanvas = document.getElementById("watermark-before-canvas");
  const afterCanvas = document.getElementById("watermark-after-canvas");
  const modeSelect = document.getElementById("watermark-mode");
  const positionSelect = document.getElementById("watermark-position");
  const tileToggle = document.getElementById("watermark-tile-toggle");
  const shadowToggle = document.getElementById("watermark-shadow-toggle");
  const textControls = document.getElementById("watermark-text-controls");
  const imageControls = document.getElementById("watermark-image-controls");
  const textInput = document.getElementById("watermark-text");
  const fontFamilySelect = document.getElementById("watermark-font-family");
  const fontSizeInput = document.getElementById("watermark-font-size");
  const textColorInput = document.getElementById("watermark-text-color");
  const outlineColorInput = document.getElementById("watermark-outline-color");
  const outlineSizeInput = document.getElementById("watermark-outline-size");
  const letterSpacingInput = document.getElementById("watermark-letter-spacing");
  const logoInput = document.getElementById("watermark-logo-upload");
  const logoStatus = document.getElementById("watermark-logo-status");
  const logoScaleInput = document.getElementById("watermark-logo-scale");
  const logoPaddingInput = document.getElementById("watermark-logo-padding");
  const opacityInput = document.getElementById("watermark-opacity");
  const opacityValue = document.getElementById("watermark-opacity-value");
  const rotationInput = document.getElementById("watermark-rotation");
  const rotationValue = document.getElementById("watermark-rotation-value");
  const shadowBlurInput = document.getElementById("watermark-shadow-blur");
  const paddingInput = document.getElementById("watermark-padding");
  const offsetXInput = document.getElementById("watermark-offset-x");
  const offsetYInput = document.getElementById("watermark-offset-y");
  const outputFormatSelect = document.getElementById("watermark-output-format");
  const outputQualitySelect = document.getElementById("watermark-output-quality");
  const downloadCurrentButton = document.getElementById("watermark-download-current");
  const downloadZipButton = document.getElementById("watermark-download-zip");
  const resetButton = document.getElementById("watermark-reset-button");
  const fitButton = document.getElementById("watermark-fit-button");
  const zoomOutButton = document.getElementById("watermark-zoom-out");
  const zoomInButton = document.getElementById("watermark-zoom-in");
  const zoomLabel = document.getElementById("watermark-zoom-label");

  if (!fileInput || !previewCanvas || !beforeCanvas || !afterCanvas) {
    return;
  }

  const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const state = {
    files: [],
    selectedIndex: -1,
    logoImage: null,
    zoomPercent: 100,
    fitToScreen: true,
    customPosition: null,
    drag: {
      active: false,
      offsetX: 0,
      offsetY: 0,
    },
    activeBounds: null,
  };

  const DEFAULTS = {
    mode: "text",
    position: "bottom-right",
    tiled: false,
    shadow: true,
    text: "© MediaTools Pro",
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 48,
    textColor: "#ffffff",
    outlineColor: "#0f172a",
    outlineSize: 2,
    letterSpacing: 2,
    logoScale: 22,
    logoPadding: 24,
    opacity: 70,
    rotation: -20,
    shadowBlur: 8,
    padding: 32,
    offsetX: 0,
    offsetY: 0,
    outputFormat: "png",
    outputQuality: "0.86",
  };

  const previewContext = previewCanvas.getContext("2d");
  const beforeContext = beforeCanvas.getContext("2d");
  const afterContext = afterCanvas.getContext("2d");
  const measurementCanvas = document.createElement("canvas");
  const measurementContext = measurementCanvas.getContext("2d");

  const setMessage = (text) => {
    if (message) {
      message.textContent = text;
    }
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const sanitizeNumber = (value, fallback) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / 1024 ** index;
    return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const baseName = (filename) => filename.replace(/\.[^.]+$/, "") || "watermarked-image";

  const updateStatLabels = () => {
    opacityValue.textContent = `${opacityInput.value}%`;
    rotationValue.textContent = `${rotationInput.value}°`;
    zoomLabel.textContent = `${Math.round(state.zoomPercent)}%`;
  };

  const toggleModePanels = () => {
    const imageMode = modeSelect.value === "image";
    textControls.hidden = imageMode;
    imageControls.hidden = !imageMode;
  };

  const getCurrentFile = () => state.files[state.selectedIndex] || null;

  const loadImageFile = (file) =>
    new Promise((resolve, reject) => {
      if (!SUPPORTED_TYPES.has(file.type)) {
        reject(new Error(`Unsupported file type: ${file.name}`));
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          name: file.name,
          width: image.naturalWidth,
          height: image.naturalHeight,
          image,
        });
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Unable to load ${file.name}.`));
      };
      image.src = objectUrl;
    });

  const loadLogoFile = (file) =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to read that logo image."));
      };
      image.src = objectUrl;
    });

  const getSettings = () => ({
    mode: modeSelect.value,
    position: positionSelect.value,
    tiled: tileToggle.checked,
    shadow: shadowToggle.checked,
    text: textInput.value.trim() || DEFAULTS.text,
    fontFamily: fontFamilySelect.value,
    fontSize: clamp(sanitizeNumber(fontSizeInput.value, DEFAULTS.fontSize), 12, 300),
    textColor: textColorInput.value,
    outlineColor: outlineColorInput.value,
    outlineSize: clamp(sanitizeNumber(outlineSizeInput.value, DEFAULTS.outlineSize), 0, 24),
    letterSpacing: clamp(sanitizeNumber(letterSpacingInput.value, DEFAULTS.letterSpacing), -4, 40),
    logoScale: clamp(sanitizeNumber(logoScaleInput.value, DEFAULTS.logoScale), 5, 100),
    logoPadding: clamp(sanitizeNumber(logoPaddingInput.value, DEFAULTS.logoPadding), 0, 240),
    opacity: clamp(sanitizeNumber(opacityInput.value, DEFAULTS.opacity), 0, 100) / 100,
    rotation: clamp(sanitizeNumber(rotationInput.value, DEFAULTS.rotation), -180, 180),
    shadowBlur: clamp(sanitizeNumber(shadowBlurInput.value, DEFAULTS.shadowBlur), 0, 40),
    padding: clamp(sanitizeNumber(paddingInput.value, DEFAULTS.padding), 0, 240),
    offsetX: clamp(sanitizeNumber(offsetXInput.value, DEFAULTS.offsetX), -2000, 2000),
    offsetY: clamp(sanitizeNumber(offsetYInput.value, DEFAULTS.offsetY), -2000, 2000),
    outputFormat: outputFormatSelect.value,
    outputQuality: sanitizeNumber(outputQualitySelect.value, 0.86),
  });

  const applyDefaultsToControls = () => {
    modeSelect.value = DEFAULTS.mode;
    positionSelect.value = DEFAULTS.position;
    tileToggle.checked = DEFAULTS.tiled;
    shadowToggle.checked = DEFAULTS.shadow;
    textInput.value = DEFAULTS.text;
    fontFamilySelect.value = DEFAULTS.fontFamily;
    fontSizeInput.value = String(DEFAULTS.fontSize);
    textColorInput.value = DEFAULTS.textColor;
    outlineColorInput.value = DEFAULTS.outlineColor;
    outlineSizeInput.value = String(DEFAULTS.outlineSize);
    letterSpacingInput.value = String(DEFAULTS.letterSpacing);
    logoScaleInput.value = String(DEFAULTS.logoScale);
    logoPaddingInput.value = String(DEFAULTS.logoPadding);
    opacityInput.value = String(DEFAULTS.opacity);
    rotationInput.value = String(DEFAULTS.rotation);
    shadowBlurInput.value = String(DEFAULTS.shadowBlur);
    paddingInput.value = String(DEFAULTS.padding);
    offsetXInput.value = String(DEFAULTS.offsetX);
    offsetYInput.value = String(DEFAULTS.offsetY);
    outputFormatSelect.value = DEFAULTS.outputFormat;
    outputQualitySelect.value = DEFAULTS.outputQuality;
    state.customPosition = null;
    state.fitToScreen = true;
    state.zoomPercent = 100;
    toggleModePanels();
    updateStatLabels();
  };

  const renderFileList = () => {
    fileCount.textContent = `${state.files.length} file${state.files.length === 1 ? "" : "s"}`;

    if (!state.files.length) {
      fileList.innerHTML = '<div class="watermark-empty-state">Your uploaded files will appear here for quick batch selection.</div>';
      return;
    }

    fileList.innerHTML = state.files
      .map((item, index) => {
        const activeClass = index === state.selectedIndex ? " is-active" : "";
        return `
          <button class="watermark-file-item${activeClass}" type="button" data-index="${index}">
            <strong>${item.name}</strong>
            <small>${item.width} × ${item.height}px · ${formatBytes(item.file.size)}</small>
          </button>
        `;
      })
      .join("");
  };

  const measureTextWidth = (context, text, letterSpacing) => {
    if (!text) {
      return 0;
    }

    let width = 0;
    for (const character of text) {
      width += context.measureText(character).width;
    }

    return width + Math.max(0, text.length - 1) * letterSpacing;
  };

  const drawSpacedText = (context, text, x, y, letterSpacing, mode) => {
    let cursor = x;
    for (const character of text) {
      if (mode === "stroke") {
        context.strokeText(character, cursor, y);
      } else {
        context.fillText(character, cursor, y);
      }
      cursor += context.measureText(character).width + letterSpacing;
    }
  };

  const buildWatermarkLayout = (source, settings) => {
    const rotationRadians = (settings.rotation * Math.PI) / 180;

    if (settings.mode === "image") {
      if (!state.logoImage) {
        return null;
      }

      const logoAspect = state.logoImage.naturalWidth / state.logoImage.naturalHeight;
      const targetWidth = clamp(source.width * (settings.logoScale / 100), 32, source.width * 0.95);
      const innerWidth = targetWidth;
      const innerHeight = innerWidth / logoAspect;
      const totalWidth = innerWidth + settings.logoPadding * 2;
      const totalHeight = innerHeight + settings.logoPadding * 2;
      const rotatedWidth =
        Math.abs(totalWidth * Math.cos(rotationRadians)) + Math.abs(totalHeight * Math.sin(rotationRadians));
      const rotatedHeight =
        Math.abs(totalWidth * Math.sin(rotationRadians)) + Math.abs(totalHeight * Math.cos(rotationRadians));

      return {
        width: totalWidth,
        height: totalHeight,
        rotatedWidth,
        rotatedHeight,
        draw(context, centerX, centerY) {
          context.save();
          context.translate(centerX, centerY);
          context.rotate(rotationRadians);
          context.globalAlpha = settings.opacity;
          if (settings.shadow && settings.shadowBlur > 0) {
            context.shadowColor = "rgba(15, 23, 42, 0.45)";
            context.shadowBlur = settings.shadowBlur;
            context.shadowOffsetX = Math.max(1, settings.shadowBlur * 0.4);
            context.shadowOffsetY = Math.max(1, settings.shadowBlur * 0.4);
          }
          context.drawImage(
            state.logoImage,
            -totalWidth / 2 + settings.logoPadding,
            -totalHeight / 2 + settings.logoPadding,
            innerWidth,
            innerHeight
          );
          context.restore();
        },
      };
    }

    measurementContext.font = `${settings.fontSize}px ${settings.fontFamily}`;
    const textWidth = measureTextWidth(measurementContext, settings.text, settings.letterSpacing);
    const textHeight = settings.fontSize * 1.25;
    const rotatedWidth =
      Math.abs(textWidth * Math.cos(rotationRadians)) + Math.abs(textHeight * Math.sin(rotationRadians));
    const rotatedHeight =
      Math.abs(textWidth * Math.sin(rotationRadians)) + Math.abs(textHeight * Math.cos(rotationRadians));

    return {
      width: textWidth,
      height: textHeight,
      rotatedWidth,
      rotatedHeight,
      draw(context, centerX, centerY) {
        context.save();
        context.translate(centerX, centerY);
        context.rotate(rotationRadians);
        context.globalAlpha = settings.opacity;
        context.font = `${settings.fontSize}px ${settings.fontFamily}`;
        context.textBaseline = "middle";
        context.lineJoin = "round";
        context.lineWidth = settings.outlineSize * 2;
        context.strokeStyle = settings.outlineColor;
        context.fillStyle = settings.textColor;

        if (settings.shadow && settings.shadowBlur > 0) {
          context.shadowColor = "rgba(15, 23, 42, 0.55)";
          context.shadowBlur = settings.shadowBlur;
          context.shadowOffsetX = Math.max(1, settings.shadowBlur * 0.35);
          context.shadowOffsetY = Math.max(1, settings.shadowBlur * 0.45);
        }

        const startX = -textWidth / 2;
        const baselineY = 0;
        if (settings.outlineSize > 0) {
          drawSpacedText(context, settings.text, startX, baselineY, settings.letterSpacing, "stroke");
        }
        drawSpacedText(context, settings.text, startX, baselineY, settings.letterSpacing, "fill");
        context.restore();
      },
    };
  };

  const resolveAnchor = (source, layout, settings) => {
    const marginX = layout.rotatedWidth / 2 + settings.padding;
    const marginY = layout.rotatedHeight / 2 + settings.padding;
    let centerX = source.width / 2;
    let centerY = source.height / 2;

    switch (settings.position) {
      case "top-left":
        centerX = marginX;
        centerY = marginY;
        break;
      case "top-right":
        centerX = source.width - marginX;
        centerY = marginY;
        break;
      case "center":
        centerX = source.width / 2;
        centerY = source.height / 2;
        break;
      case "bottom-left":
        centerX = marginX;
        centerY = source.height - marginY;
        break;
      case "custom": {
        const ratioX = state.customPosition?.xRatio ?? 0.5;
        const ratioY = state.customPosition?.yRatio ?? 0.5;
        centerX = ratioX * source.width;
        centerY = ratioY * source.height;
        break;
      }
      case "bottom-right":
      default:
        centerX = source.width - marginX;
        centerY = source.height - marginY;
        break;
    }

    centerX += settings.offsetX;
    centerY += settings.offsetY;

    return {
      centerX: clamp(centerX, marginX, source.width - marginX),
      centerY: clamp(centerY, marginY, source.height - marginY),
      marginX,
      marginY,
    };
  };

  const renderToCanvas = (canvas, source, settings, options = {}) => {
    const context = canvas.getContext("2d");
    canvas.width = source.width;
    canvas.height = source.height;
    context.clearRect(0, 0, source.width, source.height);
    context.drawImage(source.image, 0, 0, source.width, source.height);

    const layout = buildWatermarkLayout(source, settings);
    if (!layout) {
      if (settings.mode === "image") {
        setMessage("Upload a logo image to enable image watermark mode.");
      }
      return { layout: null, anchor: null };
    }

    const anchor = resolveAnchor(source, layout, settings);

    if (settings.tiled) {
      const stepX = layout.rotatedWidth + settings.padding * 2 + 24;
      const stepY = layout.rotatedHeight + settings.padding * 2 + 24;
      for (let y = anchor.centerY - stepY * 6; y < source.height + stepY * 6; y += stepY) {
        for (let x = anchor.centerX - stepX * 6; x < source.width + stepX * 6; x += stepX) {
          layout.draw(context, x, y);
        }
      }
    } else {
      layout.draw(context, anchor.centerX, anchor.centerY);
    }

    if (options.interactive) {
      state.activeBounds = {
        left: anchor.centerX - layout.rotatedWidth / 2,
        top: anchor.centerY - layout.rotatedHeight / 2,
        width: layout.rotatedWidth,
        height: layout.rotatedHeight,
        centerX: anchor.centerX,
        centerY: anchor.centerY,
      };
    }

    return { layout, anchor };
  };

  const updatePreviewCanvasScale = () => {
    const current = getCurrentFile();
    if (!current) {
      previewCanvas.style.width = "0px";
      previewCanvas.style.height = "0px";
      return;
    }

    if (state.fitToScreen) {
      const availableWidth = Math.max(previewShell.clientWidth - 32, 120);
      const availableHeight = Math.max(previewShell.clientHeight - 32, 120);
      const scale = Math.min(availableWidth / current.width, availableHeight / current.height, 1.25);
      state.zoomPercent = Math.max(5, scale * 100);
    }

    const scale = state.zoomPercent / 100;
    previewCanvas.style.width = `${Math.max(80, current.width * scale)}px`;
    previewCanvas.style.height = `${Math.max(80, current.height * scale)}px`;
    updateStatLabels();
  };

  const drawContainedPreview = (canvas, context, source, includeWatermark) => {
    const wrapper = canvas.parentElement;
    const width = Math.max(Math.floor(wrapper.clientWidth - 2), 260);
    const maxHeight = 360;
    const scale = Math.min(width / source.width, maxHeight / source.height);
    const displayWidth = Math.max(1, Math.round(source.width * scale));
    const displayHeight = Math.max(1, Math.round(source.height * scale));
    const ratio = window.devicePixelRatio || 1;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.width = Math.round(displayWidth * ratio);
    canvas.height = Math.round(displayHeight * ratio);

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, displayWidth, displayHeight);

    if (!includeWatermark) {
      context.drawImage(source.image, 0, 0, displayWidth, displayHeight);
      return;
    }

    const tempCanvas = document.createElement("canvas");
    renderToCanvas(tempCanvas, source, getSettings());
    context.drawImage(tempCanvas, 0, 0, displayWidth, displayHeight);
  };

  const updateButtons = () => {
    const hasFiles = Boolean(getCurrentFile());
    downloadCurrentButton.disabled = !hasFiles;
    downloadZipButton.disabled = state.files.length === 0;
  };

  const renderCurrentFile = () => {
    const current = getCurrentFile();
    state.activeBounds = null;
    previewPlaceholder.hidden = Boolean(current);
    updateButtons();

    if (!current) {
      selectionSummary.textContent = "No file selected.";
      previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      beforeContext.clearRect(0, 0, beforeCanvas.width, beforeCanvas.height);
      afterContext.clearRect(0, 0, afterCanvas.width, afterCanvas.height);
      state.activeBounds = null;
      return;
    }

    selectionSummary.textContent = `Editing ${current.name} · ${current.width} × ${current.height}px`;
    renderToCanvas(previewCanvas, current, getSettings(), { interactive: true });
    updatePreviewCanvasScale();
    drawContainedPreview(beforeCanvas, beforeContext, current, false);
    drawContainedPreview(afterCanvas, afterContext, current, true);
  };

  const selectFile = (index) => {
    state.selectedIndex = clamp(index, 0, state.files.length - 1);
    renderFileList();
    renderCurrentFile();
  };

  const handleIncomingFiles = async (incomingFiles) => {
    const files = Array.from(incomingFiles || []);
    if (!files.length) {
      return;
    }

    setMessage("Loading images…");

    const results = await Promise.allSettled(files.map((file) => loadImageFile(file)));
    const loadedFiles = [];
    const failures = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        loadedFiles.push(result.value);
      } else {
        failures.push(result.reason.message);
      }
    });

    if (loadedFiles.length) {
      state.files.push(...loadedFiles);
      if (state.selectedIndex === -1) {
        state.selectedIndex = 0;
      }
      renderFileList();
      renderCurrentFile();
    }

    if (failures.length && loadedFiles.length) {
      setMessage(`Loaded ${loadedFiles.length} image(s). Some files were skipped: ${failures.join(" ")}`);
    } else if (failures.length) {
      setMessage(failures.join(" "));
    } else {
      setMessage(`Loaded ${loadedFiles.length} image${loadedFiles.length === 1 ? "" : "s"}.`);
    }
  };

  const exportCanvasBlob = (canvas, format, quality) =>
    new Promise((resolve) => {
      const mimeType = format === "png" ? "image/png" : `image/${format}`;
      if (canvas.toBlob) {
        canvas.toBlob((blob) => resolve(blob), mimeType, format === "png" ? undefined : quality);
        return;
      }

      const dataUrl = canvas.toDataURL(mimeType, format === "png" ? undefined : quality);
      const [, base64] = dataUrl.split(",");
      const binary = atob(base64);
      const buffer = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        buffer[index] = binary.charCodeAt(index);
      }
      resolve(new Blob([buffer], { type: mimeType }));
    });

  const downloadBlob = (blob, filename) => {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  };

  const renderExportBlob = async (source) => {
    const exportCanvas = document.createElement("canvas");
    const settings = getSettings();
    renderToCanvas(exportCanvas, source, settings);
    return exportCanvasBlob(exportCanvas, settings.outputFormat, settings.outputQuality);
  };

  const CRC_TABLE = new Uint32Array(256).map((_, index) => {
    let crc = index;
    for (let step = 0; step < 8; step += 1) {
      crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    return crc >>> 0;
  });

  const crc32 = (bytes) => {
    let crc = 0xffffffff;
    for (let index = 0; index < bytes.length; index += 1) {
      crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  const createZip = (entries) => {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() & 31) << 11) | ((now.getMinutes() & 63) << 5) | Math.floor(now.getSeconds() / 2);
    const dosDate = (((now.getFullYear() - 1980) & 127) << 9) | (((now.getMonth() + 1) & 15) << 5) | (now.getDate() & 31);

    const pushU16 = (value) => new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
    const pushU32 = (value) =>
      new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);

    entries.forEach((entry) => {
      const nameBytes = encoder.encode(entry.name);
      const data = entry.data;
      const checksum = crc32(data);

      localParts.push(pushU32(0x04034b50));
      localParts.push(pushU16(20));
      localParts.push(pushU16(0));
      localParts.push(pushU16(0));
      localParts.push(pushU16(dosTime));
      localParts.push(pushU16(dosDate));
      localParts.push(pushU32(checksum));
      localParts.push(pushU32(data.length));
      localParts.push(pushU32(data.length));
      localParts.push(pushU16(nameBytes.length));
      localParts.push(pushU16(0));
      localParts.push(nameBytes);
      localParts.push(data);

      centralParts.push(pushU32(0x02014b50));
      centralParts.push(pushU16(20));
      centralParts.push(pushU16(20));
      centralParts.push(pushU16(0));
      centralParts.push(pushU16(0));
      centralParts.push(pushU16(dosTime));
      centralParts.push(pushU16(dosDate));
      centralParts.push(pushU32(checksum));
      centralParts.push(pushU32(data.length));
      centralParts.push(pushU32(data.length));
      centralParts.push(pushU16(nameBytes.length));
      centralParts.push(pushU16(0));
      centralParts.push(pushU16(0));
      centralParts.push(pushU16(0));
      centralParts.push(pushU16(0));
      centralParts.push(pushU32(0));
      centralParts.push(pushU32(localOffset));
      centralParts.push(nameBytes);

      localOffset += 30 + nameBytes.length + data.length;
    });

    const centralDirectorySize = centralParts.reduce((total, part) => total + part.length, 0);
    const endRecord = [
      pushU32(0x06054b50),
      pushU16(0),
      pushU16(0),
      pushU16(entries.length),
      pushU16(entries.length),
      pushU32(centralDirectorySize),
      pushU32(localOffset),
      pushU16(0),
    ];

    return new Blob([...localParts, ...centralParts, ...endRecord], { type: "application/zip" });
  };

  const handleDownloadCurrent = async () => {
    const current = getCurrentFile();
    if (!current) {
      return;
    }

    setMessage("Preparing your download…");
    const settings = getSettings();
    const blob = await renderExportBlob(current);
    downloadBlob(blob, `${baseName(current.name)}-watermarked.${settings.outputFormat === "jpeg" ? "jpg" : settings.outputFormat}`);
    setMessage(`Downloaded ${current.name}.`);
  };

  const handleDownloadZip = async () => {
    if (!state.files.length) {
      return;
    }

    setMessage(`Rendering ${state.files.length} image${state.files.length === 1 ? "" : "s"} for ZIP export…`);
    const settings = getSettings();
    const entries = [];

    for (const source of state.files) {
      const blob = await renderExportBlob(source);
      const buffer = new Uint8Array(await blob.arrayBuffer());
      entries.push({
        name: `${baseName(source.name)}-watermarked.${settings.outputFormat === "jpeg" ? "jpg" : settings.outputFormat}`,
        data: buffer,
      });
    }

    const zipBlob = createZip(entries);
    downloadBlob(zipBlob, "watermarked-images.zip");
    setMessage(`ZIP download is ready with ${entries.length} processed image${entries.length === 1 ? "" : "s"}.`);
  };

  const updateCustomPositionFromPointer = (event) => {
    const current = getCurrentFile();
    if (!current || !state.activeBounds) {
      return;
    }

    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = current.width / rect.width;
    const scaleY = current.height / rect.height;
    const pointerX = (event.clientX - rect.left) * scaleX;
    const pointerY = (event.clientY - rect.top) * scaleY;
    const boundedX = clamp(pointerX - state.drag.offsetX, 0, current.width);
    const boundedY = clamp(pointerY - state.drag.offsetY, 0, current.height);

    state.customPosition = {
      xRatio: boundedX / current.width,
      yRatio: boundedY / current.height,
    };
    positionSelect.value = "custom";
    renderCurrentFile();
  };

  const beginDrag = (event) => {
    const current = getCurrentFile();
    if (!current || !state.activeBounds) {
      return;
    }

    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = current.width / rect.width;
    const scaleY = current.height / rect.height;
    const pointerX = (event.clientX - rect.left) * scaleX;
    const pointerY = (event.clientY - rect.top) * scaleY;
    const withinBounds =
      pointerX >= state.activeBounds.left &&
      pointerX <= state.activeBounds.left + state.activeBounds.width &&
      pointerY >= state.activeBounds.top &&
      pointerY <= state.activeBounds.top + state.activeBounds.height;

    if (!withinBounds) {
      return;
    }

    state.drag.active = true;
    state.drag.offsetX = pointerX - state.activeBounds.centerX;
    state.drag.offsetY = pointerY - state.activeBounds.centerY;
    previewCanvas.style.cursor = "grabbing";
    if (typeof event.preventDefault === "function") {
      event.preventDefault();
    }
  };

  fileInput.addEventListener("change", async (event) => {
    await handleIncomingFiles(event.target.files);
    fileInput.value = "";
  });

  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "dragend", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-dragover");
    });
  });

  dropzone.addEventListener("drop", async (event) => {
    await handleIncomingFiles(event.dataTransfer?.files);
  });

  fileList.addEventListener("click", (event) => {
    const target = event.target.closest("[data-index]");
    if (!target) {
      return;
    }
    selectFile(Number.parseInt(target.dataset.index, 10));
  });

  const rerender = () => {
    toggleModePanels();
    updateStatLabels();
    renderCurrentFile();
  };

  [
    modeSelect,
    positionSelect,
    tileToggle,
    shadowToggle,
    textInput,
    fontFamilySelect,
    fontSizeInput,
    textColorInput,
    outlineColorInput,
    outlineSizeInput,
    letterSpacingInput,
    logoScaleInput,
    logoPaddingInput,
    opacityInput,
    rotationInput,
    shadowBlurInput,
    paddingInput,
    offsetXInput,
    offsetYInput,
    outputFormatSelect,
    outputQualitySelect,
  ].forEach((control) => {
    control.addEventListener("input", rerender);
    control.addEventListener("change", rerender);
  });

  logoInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      state.logoImage = await loadLogoFile(file);
      logoStatus.textContent = `Logo ready: ${file.name} (${state.logoImage.naturalWidth} × ${state.logoImage.naturalHeight}px)`;
      if (modeSelect.value !== "image") {
        modeSelect.value = "image";
      }
      rerender();
      setMessage("Logo watermark loaded.");
    } catch (error) {
      setMessage(error.message);
    }
  });

  resetButton.addEventListener("click", () => {
    applyDefaultsToControls();
    rerender();
    setMessage("Watermark settings were reset.");
  });

  fitButton.addEventListener("click", () => {
    state.fitToScreen = true;
    updatePreviewCanvasScale();
  });

  zoomInButton.addEventListener("click", () => {
    state.fitToScreen = false;
    state.zoomPercent = clamp(state.zoomPercent + 10, 10, 400);
    updatePreviewCanvasScale();
  });

  zoomOutButton.addEventListener("click", () => {
    state.fitToScreen = false;
    state.zoomPercent = clamp(state.zoomPercent - 10, 10, 400);
    updatePreviewCanvasScale();
  });

  downloadCurrentButton.addEventListener("click", handleDownloadCurrent);
  downloadZipButton.addEventListener("click", handleDownloadZip);

  previewCanvas.addEventListener("mousedown", beginDrag);
  previewCanvas.addEventListener("mousemove", (event) => {
    if (state.drag.active) {
      updateCustomPositionFromPointer(event);
      return;
    }

    const current = getCurrentFile();
    if (!current || !state.activeBounds) {
      previewCanvas.style.cursor = "default";
      return;
    }

    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = current.width / rect.width;
    const scaleY = current.height / rect.height;
    const pointerX = (event.clientX - rect.left) * scaleX;
    const pointerY = (event.clientY - rect.top) * scaleY;
    const hovering =
      pointerX >= state.activeBounds.left &&
      pointerX <= state.activeBounds.left + state.activeBounds.width &&
      pointerY >= state.activeBounds.top &&
      pointerY <= state.activeBounds.top + state.activeBounds.height;
    previewCanvas.style.cursor = hovering ? "grab" : "default";
  });

  window.addEventListener("mouseup", () => {
    state.drag.active = false;
    previewCanvas.style.cursor = "default";
  });

  previewCanvas.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    beginDrag(touch);
  }, { passive: false });

  previewCanvas.addEventListener("touchmove", (event) => {
    if (!state.drag.active) {
      return;
    }
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    updateCustomPositionFromPointer(touch);
    event.preventDefault();
  }, { passive: false });

  window.addEventListener("touchend", () => {
    state.drag.active = false;
    previewCanvas.style.cursor = "default";
  });

  window.addEventListener("resize", () => {
    updatePreviewCanvasScale();
    const current = getCurrentFile();
    if (current) {
      drawContainedPreview(beforeCanvas, beforeContext, current, false);
      drawContainedPreview(afterCanvas, afterContext, current, true);
    }
  });

  applyDefaultsToControls();
  renderFileList();
  renderCurrentFile();
  updateButtons();
})();
