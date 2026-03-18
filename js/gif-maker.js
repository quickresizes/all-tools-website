const gifMakerRoot = document.getElementById("gif-maker-app");

if (gifMakerRoot) {
  const els = {
    uploadInput: document.getElementById("gif-upload"),
    dropzone: document.getElementById("gif-dropzone"),
    urlInput: document.getElementById("gif-url-input"),
    urlImport: document.getElementById("gif-url-import"),
    status: document.getElementById("gif-status"),
    frameList: document.getElementById("frame-list"),
    layerList: document.getElementById("layer-list"),
    previewCanvas: document.getElementById("gif-preview-canvas"),
    previewToggle: document.getElementById("preview-toggle"),
    previewLoop: document.getElementById("preview-loop"),
    previewStats: document.getElementById("preview-stats"),
    previewScrubber: document.getElementById("preview-scrubber"),
    globalSpeed: document.getElementById("global-speed"),
    globalDuration: document.getElementById("global-duration"),
    applyDurationAll: document.getElementById("apply-duration-all"),
    reverseFrames: document.getElementById("reverse-frames"),
    frameDuration: document.getElementById("frame-duration"),
    frameRotation: document.getElementById("frame-rotation"),
    frameCropX: document.getElementById("frame-crop-x"),
    frameCropY: document.getElementById("frame-crop-y"),
    frameCropWidth: document.getElementById("frame-crop-width"),
    frameCropHeight: document.getElementById("frame-crop-height"),
    frameBrightness: document.getElementById("frame-brightness"),
    frameContrast: document.getElementById("frame-contrast"),
    frameSaturation: document.getElementById("frame-saturation"),
    flipHorizontal: document.getElementById("flip-horizontal"),
    flipVertical: document.getElementById("flip-vertical"),
    resetFrameEdits: document.getElementById("reset-frame-edits"),
    addTextLayer: document.getElementById("add-text-layer"),
    addStickerLayer: document.getElementById("add-sticker-layer"),
    duplicateLayer: document.getElementById("duplicate-layer"),
    deleteLayer: document.getElementById("delete-layer"),
    layerType: document.getElementById("layer-type"),
    layerTarget: document.getElementById("layer-target"),
    layerContent: document.getElementById("layer-content"),
    layerFont: document.getElementById("layer-font"),
    layerColor: document.getElementById("layer-color"),
    layerOutlineColor: document.getElementById("layer-outline-color"),
    layerSize: document.getElementById("layer-size"),
    layerOutlineWidth: document.getElementById("layer-outline-width"),
    layerShadow: document.getElementById("layer-shadow"),
    layerRotation: document.getElementById("layer-rotation"),
    layerScale: document.getElementById("layer-scale"),
    stickerPresets: document.getElementById("sticker-presets"),
    resolutionPreset: document.getElementById("resolution-preset"),
    outputWidth: document.getElementById("output-width"),
    outputHeight: document.getElementById("output-height"),
    lockAspectRatio: document.getElementById("lock-aspect-ratio"),
    qualityLevel: document.getElementById("quality-level"),
    loopMode: document.getElementById("loop-mode"),
    loopCount: document.getElementById("loop-count"),
    transitionType: document.getElementById("transition-type"),
    transitionSteps: document.getElementById("transition-steps"),
    generateGif: document.getElementById("generate-gif"),
    downloadGif: document.getElementById("download-gif"),
    progressBar: document.getElementById("gif-progress-bar"),
    progressText: document.getElementById("gif-progress-text"),
    exportSummary: document.getElementById("export-summary")
  };

  const previewContext = els.previewCanvas.getContext("2d");
  const stickers = ["😀", "🔥", "✨", "🎉", "💥", "✅", "🚀", "❤️", "⭐", "😎", "📣", "💡"];
  const frameDefaults = () => ({
    duration: 400,
    rotation: 0,
    cropX: 0,
    cropY: 0,
    cropWidth: 100,
    cropHeight: 100,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    flipX: false,
    flipY: false
  });

  const state = {
    frames: [],
    selectedFrameId: null,
    layers: [],
    selectedLayerId: null,
    isPlaying: true,
    playbackIndex: 0,
    playbackElapsed: 0,
    lastTick: 0,
    objectUrl: null,
    drag: {
      activeLayerId: null,
      offsetX: 0,
      offsetY: 0
    }
  };

  const qualityMap = {
    low: { gifQuality: 20, workers: 2, transitionFactor: 1 },
    medium: { gifQuality: 10, workers: 2, transitionFactor: 1 },
    high: { gifQuality: 5, workers: 4, transitionFactor: 1.5 }
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const uid = (prefix) => `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

  const setStatus = (message) => {
    els.status.textContent = message;
  };

  const getSelectedFrame = () => state.frames.find((frame) => frame.id === state.selectedFrameId) || null;
  const getSelectedLayer = () => state.layers.find((layer) => layer.id === state.selectedLayerId) || null;

  const getAspectRatio = () => {
    const firstFrame = state.frames[0];
    if (!firstFrame) return 16 / 9;
    return firstFrame.width / firstFrame.height || 16 / 9;
  };

  const fitWithin = (width, height, maxWidth, maxHeight) => {
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    return {
      width: Math.max(1, Math.round(width * ratio)),
      height: Math.max(1, Math.round(height * ratio))
    };
  };

  const getOutputSize = () => {
    const firstFrame = state.frames[0];
    if (!firstFrame) {
      return { width: 960, height: 540 };
    }

    const preset = els.resolutionPreset.value;
    if (preset === "original") {
      return { width: firstFrame.width, height: firstFrame.height };
    }

    if (preset === "720p") {
      return fitWithin(firstFrame.width, firstFrame.height, 1280, 720);
    }

    if (preset === "480p") {
      return fitWithin(firstFrame.width, firstFrame.height, 854, 480);
    }

    return {
      width: clamp(Math.round(toNumber(els.outputWidth.value, 960)), 64, 4096),
      height: clamp(Math.round(toNumber(els.outputHeight.value, 540)), 64, 4096)
    };
  };

  const updateOutputInputs = (source = "preset") => {
    if (!state.frames.length) return;
    const firstFrame = state.frames[0];
    const preset = els.resolutionPreset.value;
    let target = getOutputSize();

    if (source === "preset" && preset === "custom") {
      target = fitWithin(firstFrame.width, firstFrame.height, 960, 540);
    }

    if (source === "preset") {
      els.outputWidth.value = String(target.width);
      els.outputHeight.value = String(target.height);
    }
  };

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
      reader.readAsDataURL(file);
    });

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image could not be loaded."));
      img.src = src;
    });

  const createFrame = async (src, label) => {
    const image = await loadImage(src);
    return {
      id: uid("frame"),
      name: label,
      src,
      image,
      width: image.width,
      height: image.height,
      thumb: src,
      ...frameDefaults()
    };
  };

  const syncFrameControls = () => {
    const frame = getSelectedFrame();
    const disabled = !frame;
    [
      els.frameDuration,
      els.frameRotation,
      els.frameCropX,
      els.frameCropY,
      els.frameCropWidth,
      els.frameCropHeight,
      els.frameBrightness,
      els.frameContrast,
      els.frameSaturation,
      els.flipHorizontal,
      els.flipVertical,
      els.resetFrameEdits
    ].forEach((input) => {
      input.disabled = disabled;
    });

    if (!frame) return;

    els.frameDuration.value = String(frame.duration);
    els.frameRotation.value = String(frame.rotation);
    els.frameCropX.value = String(frame.cropX);
    els.frameCropY.value = String(frame.cropY);
    els.frameCropWidth.value = String(frame.cropWidth);
    els.frameCropHeight.value = String(frame.cropHeight);
    els.frameBrightness.value = String(frame.brightness);
    els.frameContrast.value = String(frame.contrast);
    els.frameSaturation.value = String(frame.saturation);
  };

  const syncLayerControls = () => {
    const layer = getSelectedLayer();
    const disabled = !layer;

    [
      els.layerTarget,
      els.layerContent,
      els.layerFont,
      els.layerColor,
      els.layerOutlineColor,
      els.layerSize,
      els.layerOutlineWidth,
      els.layerShadow,
      els.layerRotation,
      els.layerScale,
      els.duplicateLayer,
      els.deleteLayer
    ].forEach((input) => {
      input.disabled = disabled;
    });

    if (!layer) {
      els.layerType.value = "No layer selected";
      els.layerContent.value = "";
      return;
    }

    els.layerType.value = layer.type === "sticker" ? "Sticker" : "Text";
    els.layerTarget.value = layer.target;
    els.layerContent.value = layer.content;
    els.layerFont.value = layer.font;
    els.layerColor.value = layer.color;
    els.layerOutlineColor.value = layer.outlineColor;
    els.layerSize.value = String(layer.size);
    els.layerOutlineWidth.value = String(layer.outlineWidth);
    els.layerShadow.value = String(layer.shadow);
    els.layerRotation.value = String(layer.rotation);
    els.layerScale.value = String(layer.scale);
  };

  const renderFrameList = () => {
    els.frameList.innerHTML = "";

    if (!state.frames.length) {
      els.frameList.innerHTML = '<p class="meta-text">No frames yet. Upload multiple images to create a GIF.</p>';
      return;
    }

    state.frames.forEach((frame, index) => {
      const card = document.createElement("article");
      card.className = `frame-card${frame.id === state.selectedFrameId ? " active" : ""}`;
      card.draggable = true;
      card.dataset.frameId = frame.id;
      card.innerHTML = `
        <button type="button" class="frame-preview-btn" data-action="select">
          <img src="${frame.thumb}" alt="${frame.name}" />
        </button>
        <div class="frame-card-body">
          <div class="frame-card-title-row">
            <strong>Frame ${index + 1}</strong>
            <span>${frame.width}×${frame.height}</span>
          </div>
          <div class="frame-card-title-row">
            <span>${frame.name}</span>
            <span>${frame.duration}ms</span>
          </div>
          <div class="frame-card-actions">
            <button type="button" class="btn btn-secondary" data-action="duplicate">Duplicate</button>
            <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
          </div>
        </div>
      `;
      els.frameList.append(card);
    });
  };

  const renderLayerList = () => {
    els.layerList.innerHTML = "";

    if (!state.layers.length) {
      els.layerList.innerHTML = '<p class="meta-text">No overlays yet. Add text or stickers.</p>';
      return;
    }

    state.layers.forEach((layer, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `layer-chip${layer.id === state.selectedLayerId ? " active" : ""}`;
      item.dataset.layerId = layer.id;
      item.innerHTML = `<span>${layer.type === "sticker" ? "Sticker" : "Text"} ${index + 1}</span><small>${layer.target === "all" ? "All" : "Current"}</small>`;
      els.layerList.append(item);
    });
  };

  const getFrameCanvas = (frame, size, blend = 1, nextFrame = null, slideProgress = 0) => {
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");

    const drawSingleFrame = (frameToDraw, alpha = 1, offsetX = 0) => {
      const cropX = (frameToDraw.cropX / 100) * frameToDraw.width;
      const cropY = (frameToDraw.cropY / 100) * frameToDraw.height;
      const cropWidth = Math.max(1, (frameToDraw.cropWidth / 100) * frameToDraw.width);
      const cropHeight = Math.max(1, (frameToDraw.cropHeight / 100) * frameToDraw.height);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.filter = `brightness(${frameToDraw.brightness}%) contrast(${frameToDraw.contrast}%) saturate(${frameToDraw.saturation}%)`;
      ctx.translate(size.width / 2 + offsetX, size.height / 2);
      ctx.scale(frameToDraw.flipX ? -1 : 1, frameToDraw.flipY ? -1 : 1);
      ctx.rotate((frameToDraw.rotation * Math.PI) / 180);
      ctx.drawImage(
        frameToDraw.image,
        cropX,
        cropY,
        Math.min(cropWidth, frameToDraw.width - cropX),
        Math.min(cropHeight, frameToDraw.height - cropY),
        -size.width / 2,
        -size.height / 2,
        size.width,
        size.height
      );
      ctx.restore();
    };

    ctx.clearRect(0, 0, size.width, size.height);
    if (nextFrame && slideProgress > 0) {
      drawSingleFrame(frame, 1, -slideProgress * size.width);
      drawSingleFrame(nextFrame, 1, size.width - slideProgress * size.width);
    } else if (nextFrame && blend < 1) {
      drawSingleFrame(frame, 1);
      drawSingleFrame(nextFrame, 1 - blend);
    } else {
      drawSingleFrame(frame, 1);
    }

    return canvas;
  };

  const drawLayers = (ctx, currentFrameId, size) => {
    state.layers.forEach((layer) => {
      if (layer.target === "current" && layer.frameId !== currentFrameId) return;
      ctx.save();
      ctx.translate(layer.x * size.width, layer.y * size.height);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.scale / 100, layer.scale / 100);
      ctx.fillStyle = layer.color;
      ctx.strokeStyle = layer.outlineColor;
      ctx.lineWidth = layer.outlineWidth;
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = layer.shadow;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${layer.size}px ${layer.font}`;
      if (layer.outlineWidth > 0) {
        ctx.strokeText(layer.content, 0, 0);
      }
      ctx.fillText(layer.content, 0, 0);
      ctx.restore();
    });
  };

  const buildPlaybackFrames = () => {
    const orderedFrames = [...state.frames];
    const speed = toNumber(els.globalSpeed.value, 100) / 100;
    const transitionType = els.transitionType.value;
    const transitionSteps = clamp(toNumber(els.transitionSteps.value, 2), 1, 6);
    const result = [];

    orderedFrames.forEach((frame, index) => {
      result.push({
        frame,
        nextFrame: null,
        blend: 1,
        slideProgress: 0,
        duration: Math.max(20, Math.round(frame.duration / speed))
      });

      const nextFrame = orderedFrames[index + 1];
      if (!nextFrame || transitionType === "none") return;

      for (let step = 1; step <= transitionSteps; step += 1) {
        const progress = step / (transitionSteps + 1);
        result.push({
          frame,
          nextFrame,
          blend: 1 - progress,
          slideProgress: transitionType === "slide" ? progress : 0,
          duration: Math.max(20, Math.round(frame.duration / speed / (transitionSteps + 1)))
        });
      }
    });

    return result;
  };

  const renderPreviewFrame = () => {
    const playbackFrames = buildPlaybackFrames();
    const previewSize = fitWithin(getOutputSize().width, getOutputSize().height, 1000, 700);
    if (els.previewCanvas.width !== previewSize.width || els.previewCanvas.height !== previewSize.height) {
      els.previewCanvas.width = previewSize.width;
      els.previewCanvas.height = previewSize.height;
      els.previewCanvas.style.aspectRatio = `${previewSize.width} / ${previewSize.height}`;
    }

    if (!playbackFrames.length) {
      previewContext.clearRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
      previewContext.fillStyle = "#64748b";
      previewContext.font = "600 24px Inter, sans-serif";
      previewContext.textAlign = "center";
      previewContext.fillText("Upload images to preview your GIF", els.previewCanvas.width / 2, els.previewCanvas.height / 2);
      els.previewStats.textContent = "No frames loaded yet.";
      els.previewScrubber.max = "0";
      els.previewScrubber.value = "0";
      return;
    }

    state.playbackIndex = clamp(state.playbackIndex, 0, playbackFrames.length - 1);
    els.previewScrubber.max = String(playbackFrames.length - 1);
    els.previewScrubber.value = String(state.playbackIndex);

    const current = playbackFrames[state.playbackIndex];
    const canvas = getFrameCanvas(current.frame, {
      width: els.previewCanvas.width,
      height: els.previewCanvas.height
    }, current.blend, current.nextFrame, current.slideProgress);

    previewContext.clearRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
    previewContext.drawImage(canvas, 0, 0);
    drawLayers(previewContext, current.frame.id, {
      width: els.previewCanvas.width,
      height: els.previewCanvas.height
    });

    els.previewStats.textContent = `${playbackFrames.length} playback frames • ${state.frames.length} source frames • ${getOutputSize().width}×${getOutputSize().height}px output`;
  };

  const tickPreview = (timestamp) => {
    if (!state.lastTick) state.lastTick = timestamp;
    const delta = timestamp - state.lastTick;
    state.lastTick = timestamp;

    const playbackFrames = buildPlaybackFrames();
    if (playbackFrames.length && state.isPlaying) {
      state.playbackElapsed += delta;
      const currentFrame = playbackFrames[state.playbackIndex];
      if (state.playbackElapsed >= currentFrame.duration) {
        state.playbackElapsed = 0;
        if (state.playbackIndex >= playbackFrames.length - 1) {
          if (els.previewLoop.checked) {
            state.playbackIndex = 0;
          } else {
            state.playbackIndex = playbackFrames.length - 1;
            state.isPlaying = false;
            els.previewToggle.textContent = "Play";
          }
        } else {
          state.playbackIndex += 1;
        }
      }
    }

    renderPreviewFrame();
    requestAnimationFrame(tickPreview);
  };

  const updateWorkspace = () => {
    renderFrameList();
    renderLayerList();
    syncFrameControls();
    syncLayerControls();
    updateOutputInputs();
    renderPreviewFrame();
  };

  const addFrames = async (files) => {
    const acceptedFiles = Array.from(files).filter((file) => /image\/(jpeg|png|webp)/.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name));
    if (!acceptedFiles.length) {
      setStatus("Please upload JPG, JPEG, PNG, or WEBP images.");
      return;
    }

    setStatus(`Loading ${acceptedFiles.length} frame${acceptedFiles.length > 1 ? "s" : ""}...`);

    for (const file of acceptedFiles) {
      const src = await readFileAsDataURL(file);
      const frame = await createFrame(src, file.name);
      state.frames.push(frame);
      if (!state.selectedFrameId) state.selectedFrameId = frame.id;
    }

    updateWorkspace();
    setStatus(`${state.frames.length} frame${state.frames.length > 1 ? "s" : ""} ready. Drag frames to reorder or edit the selected frame.`);
  };

  const updateFrame = (updater) => {
    const frame = getSelectedFrame();
    if (!frame) return;
    updater(frame);
    updateWorkspace();
  };

  const addLayer = (type, content) => {
    const fallbackFrame = getSelectedFrame();
    const layer = {
      id: uid("layer"),
      type,
      frameId: fallbackFrame?.id || null,
      target: fallbackFrame ? "current" : "all",
      content,
      font: type === "sticker" ? "Arial" : "Inter",
      color: "#ffffff",
      outlineColor: "#111827",
      size: type === "sticker" ? 56 : 48,
      outlineWidth: type === "sticker" ? 0 : 4,
      shadow: 8,
      rotation: 0,
      scale: 100,
      x: 0.5,
      y: type === "sticker" ? 0.35 : 0.18
    };
    state.layers.push(layer);
    state.selectedLayerId = layer.id;
    updateWorkspace();
  };

  const updateLayer = (updater) => {
    const layer = getSelectedLayer();
    if (!layer) return;
    updater(layer);
    updateWorkspace();
  };

  const removeFrame = (frameId) => {
    const index = state.frames.findIndex((frame) => frame.id === frameId);
    if (index === -1) return;
    state.frames.splice(index, 1);
    if (state.selectedFrameId === frameId) {
      state.selectedFrameId = state.frames[Math.max(0, index - 1)]?.id || state.frames[0]?.id || null;
    }
    state.layers.forEach((layer) => {
      if (layer.frameId === frameId) {
        layer.frameId = state.frames[0]?.id || null;
        if (!layer.frameId) layer.target = "all";
      }
    });
    updateWorkspace();
  };

  const duplicateFrame = async (frameId) => {
    const frame = state.frames.find((item) => item.id === frameId);
    if (!frame) return;
    const duplicate = await createFrame(frame.src, `${frame.name.replace(/( copy)?$/, "")} copy`);
    Object.assign(duplicate, {
      duration: frame.duration,
      rotation: frame.rotation,
      cropX: frame.cropX,
      cropY: frame.cropY,
      cropWidth: frame.cropWidth,
      cropHeight: frame.cropHeight,
      brightness: frame.brightness,
      contrast: frame.contrast,
      saturation: frame.saturation,
      flipX: frame.flipX,
      flipY: frame.flipY
    });
    const index = state.frames.findIndex((item) => item.id === frameId);
    state.frames.splice(index + 1, 0, duplicate);
    state.selectedFrameId = duplicate.id;
    updateWorkspace();
  };

  const duplicateLayer = () => {
    const layer = getSelectedLayer();
    if (!layer) return;
    const clone = { ...layer, id: uid("layer"), x: clamp(layer.x + 0.03, 0.08, 0.92), y: clamp(layer.y + 0.03, 0.08, 0.92) };
    state.layers.push(clone);
    state.selectedLayerId = clone.id;
    updateWorkspace();
  };

  const getCanvasCoordinates = (event) => {
    const rect = els.previewCanvas.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1)
    };
  };

  const findTopLayerAtPoint = (point) => {
    const currentFrame = buildPlaybackFrames()[state.playbackIndex]?.frame?.id || null;
    for (let index = state.layers.length - 1; index >= 0; index -= 1) {
      const layer = state.layers[index];
      if (layer.target === "current" && layer.frameId !== currentFrame) continue;
      const halfWidth = ((layer.size * (layer.scale / 100)) / els.previewCanvas.width) * Math.max(0.6, layer.content.length * 0.3);
      const halfHeight = ((layer.size * (layer.scale / 100)) / els.previewCanvas.height) * 0.7;
      if (Math.abs(point.x - layer.x) <= halfWidth && Math.abs(point.y - layer.y) <= halfHeight) {
        return layer;
      }
    }
    return null;
  };

  const updateExportSummary = (blob = null) => {
    const output = getOutputSize();
    const totalMs = buildPlaybackFrames().reduce((total, frame) => total + frame.duration, 0);
    const sizeLine = blob
      ? `<p><strong>Generated size:</strong> ${(blob.size / 1024).toFixed(1)} KB</p>`
      : "";
    els.exportSummary.innerHTML = `
      <p><strong>Output:</strong> ${output.width}×${output.height}px</p>
      <p><strong>Total playback:</strong> ${(totalMs / 1000).toFixed(2)}s</p>
      <p><strong>Quality:</strong> ${els.qualityLevel.value}</p>
      ${sizeLine}
      <p><strong>Optimization tips:</strong> lower resolution, fewer transition steps, and shorter frame durations reduce file size.</p>
    `;
  };

  const generateGifBlob = () =>
    new Promise((resolve, reject) => {
      if (!window.GIF) {
        reject(new Error("GIF encoder library is unavailable. Check your internet connection and reload the page."));
        return;
      }

      const playbackFrames = buildPlaybackFrames();
      if (!playbackFrames.length) {
        reject(new Error("Upload at least one frame before exporting."));
        return;
      }

      const quality = qualityMap[els.qualityLevel.value] || qualityMap.medium;
      const outputSize = getOutputSize();
      const repeat = els.loopMode.value === "infinite" ? 0 : clamp(toNumber(els.loopCount.value, 1) - 1, 0, 999);
      const gif = new window.GIF({
        workers: quality.workers,
        quality: quality.gifQuality,
        workerScript: "https://cdn.jsdelivr.net/npm/gif.js.optimized/dist/gif.worker.js",
        width: outputSize.width,
        height: outputSize.height,
        repeat,
        background: "#ffffff"
      });

      els.progressBar.style.width = "0%";
      els.progressText.textContent = "Preparing frames...";
      els.downloadGif.hidden = true;
      els.generateGif.disabled = true;

      playbackFrames.forEach((playbackFrame) => {
        const frameCanvas = getFrameCanvas(
          playbackFrame.frame,
          outputSize,
          playbackFrame.blend,
          playbackFrame.nextFrame,
          playbackFrame.slideProgress
        );
        const ctx = frameCanvas.getContext("2d");
        drawLayers(ctx, playbackFrame.frame.id, outputSize);
        gif.addFrame(frameCanvas, { copy: true, delay: playbackFrame.duration });
      });

      gif.on("progress", (progress) => {
        const percent = Math.round(progress * 100);
        els.progressBar.style.width = `${percent}%`;
        els.progressText.textContent = `Generating GIF... ${percent}%`;
      });

      gif.on("finished", (blob) => {
        els.generateGif.disabled = false;
        resolve(blob);
      });

      gif.on("abort", () => {
        els.generateGif.disabled = false;
        reject(new Error("GIF generation was aborted."));
      });

      try {
        gif.render();
      } catch (error) {
        els.generateGif.disabled = false;
        reject(error);
      }
    });

  els.uploadInput.addEventListener("change", async (event) => {
    if (!event.target.files?.length) return;
    try {
      await addFrames(event.target.files);
      event.target.value = "";
    } catch (error) {
      setStatus(error.message);
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    els.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    els.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropzone.classList.remove("dragover");
    });
  });

  els.dropzone.addEventListener("drop", async (event) => {
    if (!event.dataTransfer?.files?.length) return;
    try {
      await addFrames(event.dataTransfer.files);
    } catch (error) {
      setStatus(error.message);
    }
  });

  els.urlImport.addEventListener("click", async () => {
    const url = els.urlInput.value.trim();
    if (!url) {
      setStatus("Enter an image URL first.");
      return;
    }

    try {
      setStatus("Fetching image from URL...");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Unable to fetch that image URL.");
      const blob = await response.blob();
      const extension = blob.type.split("/").pop() || "png";
      const file = new File([blob], `imported-frame.${extension}`, { type: blob.type || "image/png" });
      await addFrames([file]);
      els.urlInput.value = "";
    } catch (error) {
      setStatus(`${error.message} The remote server may block browser-based imports.`);
    }
  });

  els.applyDurationAll.addEventListener("click", () => {
    const duration = clamp(toNumber(els.globalDuration.value, 400), 20, 10000);
    state.frames.forEach((frame) => {
      frame.duration = duration;
    });
    updateWorkspace();
  });

  els.reverseFrames.addEventListener("click", () => {
    state.frames.reverse();
    state.selectedFrameId = state.frames[0]?.id || null;
    updateWorkspace();
  });

  els.frameDuration.addEventListener("input", (event) => {
    updateFrame((frame) => {
      frame.duration = clamp(toNumber(event.target.value, 400), 20, 10000);
    });
  });

  [
    [els.frameRotation, "rotation"],
    [els.frameCropX, "cropX"],
    [els.frameCropY, "cropY"],
    [els.frameCropWidth, "cropWidth"],
    [els.frameCropHeight, "cropHeight"],
    [els.frameBrightness, "brightness"],
    [els.frameContrast, "contrast"],
    [els.frameSaturation, "saturation"]
  ].forEach(([element, key]) => {
    element.addEventListener("input", (event) => {
      updateFrame((frame) => {
        frame[key] = toNumber(event.target.value, frame[key]);
        if (key === "cropWidth") frame.cropWidth = clamp(frame.cropWidth, 10, 100);
        if (key === "cropHeight") frame.cropHeight = clamp(frame.cropHeight, 10, 100);
        if (key === "cropX") frame.cropX = clamp(frame.cropX, 0, 90);
        if (key === "cropY") frame.cropY = clamp(frame.cropY, 0, 90);
      });
    });
  });

  els.flipHorizontal.addEventListener("click", () => updateFrame((frame) => { frame.flipX = !frame.flipX; }));
  els.flipVertical.addEventListener("click", () => updateFrame((frame) => { frame.flipY = !frame.flipY; }));
  els.resetFrameEdits.addEventListener("click", () => {
    updateFrame((frame) => Object.assign(frame, frameDefaults(), { id: frame.id, name: frame.name, src: frame.src, image: frame.image, width: frame.width, height: frame.height, thumb: frame.thumb }));
  });

  els.addTextLayer.addEventListener("click", () => addLayer("text", "Your message"));
  els.addStickerLayer.addEventListener("click", () => addLayer("sticker", "😀"));
  els.duplicateLayer.addEventListener("click", duplicateLayer);
  els.deleteLayer.addEventListener("click", () => {
    if (!state.selectedLayerId) return;
    state.layers = state.layers.filter((layer) => layer.id !== state.selectedLayerId);
    state.selectedLayerId = state.layers[0]?.id || null;
    updateWorkspace();
  });

  stickers.forEach((sticker) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sticker-pill";
    button.textContent = sticker;
    button.addEventListener("click", () => addLayer("sticker", sticker));
    els.stickerPresets.append(button);
  });

  [
    [els.layerTarget, "target"],
    [els.layerContent, "content"],
    [els.layerFont, "font"],
    [els.layerColor, "color"],
    [els.layerOutlineColor, "outlineColor"],
    [els.layerSize, "size"],
    [els.layerOutlineWidth, "outlineWidth"],
    [els.layerShadow, "shadow"],
    [els.layerRotation, "rotation"],
    [els.layerScale, "scale"]
  ].forEach(([element, key]) => {
    element.addEventListener("input", (event) => {
      updateLayer((layer) => {
        layer[key] = ["size", "outlineWidth", "shadow", "rotation", "scale"].includes(key)
          ? toNumber(event.target.value, layer[key])
          : event.target.value;
        if (key === "target") {
          layer.frameId = event.target.value === "current" ? state.selectedFrameId : null;
        }
      });
    });
    if (element.tagName === "SELECT") {
      element.addEventListener("change", (event) => {
        updateLayer((layer) => {
          layer[key] = event.target.value;
          if (key === "target") {
            layer.frameId = event.target.value === "current" ? state.selectedFrameId : null;
          }
        });
      });
    }
  });

  els.frameList.addEventListener("click", (event) => {
    const card = event.target.closest(".frame-card");
    if (!card) return;
    const frameId = card.dataset.frameId;
    const action = event.target.dataset.action;
    if (action === "delete") {
      removeFrame(frameId);
      return;
    }
    if (action === "duplicate") {
      duplicateFrame(frameId);
      return;
    }
    state.selectedFrameId = frameId;
    state.playbackIndex = Math.min(state.playbackIndex, Math.max(0, buildPlaybackFrames().length - 1));
    updateWorkspace();
  });

  els.frameList.addEventListener("dragstart", (event) => {
    const card = event.target.closest(".frame-card");
    if (!card) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.dataset.frameId);
  });

  els.frameList.addEventListener("dragover", (event) => {
    event.preventDefault();
    const card = event.target.closest(".frame-card");
    if (card) card.classList.add("drag-target");
  });

  els.frameList.addEventListener("dragleave", (event) => {
    const card = event.target.closest(".frame-card");
    if (card) card.classList.remove("drag-target");
  });

  els.frameList.addEventListener("drop", (event) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain");
    const targetCard = event.target.closest(".frame-card");
    document.querySelectorAll(".frame-card.drag-target").forEach((card) => card.classList.remove("drag-target"));
    if (!sourceId || !targetCard) return;
    const targetId = targetCard.dataset.frameId;
    if (sourceId === targetId) return;
    const sourceIndex = state.frames.findIndex((frame) => frame.id === sourceId);
    const targetIndex = state.frames.findIndex((frame) => frame.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const [moved] = state.frames.splice(sourceIndex, 1);
    state.frames.splice(targetIndex, 0, moved);
    updateWorkspace();
  });

  els.layerList.addEventListener("click", (event) => {
    const button = event.target.closest(".layer-chip");
    if (!button) return;
    state.selectedLayerId = button.dataset.layerId;
    updateWorkspace();
  });

  els.previewToggle.addEventListener("click", () => {
    state.isPlaying = !state.isPlaying;
    els.previewToggle.textContent = state.isPlaying ? "Pause" : "Play";
  });

  els.previewScrubber.addEventListener("input", (event) => {
    state.playbackIndex = toNumber(event.target.value, 0);
    state.playbackElapsed = 0;
    renderPreviewFrame();
  });

  els.previewCanvas.addEventListener("pointerdown", (event) => {
    const point = getCanvasCoordinates(event);
    const layer = findTopLayerAtPoint(point);
    if (!layer) return;
    state.selectedLayerId = layer.id;
    state.drag.activeLayerId = layer.id;
    state.drag.offsetX = point.x - layer.x;
    state.drag.offsetY = point.y - layer.y;
    els.previewCanvas.setPointerCapture(event.pointerId);
    updateWorkspace();
  });

  els.previewCanvas.addEventListener("pointermove", (event) => {
    if (!state.drag.activeLayerId) return;
    const layer = state.layers.find((item) => item.id === state.drag.activeLayerId);
    if (!layer) return;
    const point = getCanvasCoordinates(event);
    layer.x = clamp(point.x - state.drag.offsetX, 0.05, 0.95);
    layer.y = clamp(point.y - state.drag.offsetY, 0.05, 0.95);
    renderPreviewFrame();
    syncLayerControls();
  });

  const stopLayerDrag = () => {
    state.drag.activeLayerId = null;
  };

  els.previewCanvas.addEventListener("pointerup", stopLayerDrag);
  els.previewCanvas.addEventListener("pointercancel", stopLayerDrag);

  els.resolutionPreset.addEventListener("change", () => {
    updateOutputInputs("preset");
    updateWorkspace();
  });

  els.outputWidth.addEventListener("input", (event) => {
    if (els.resolutionPreset.value !== "custom") {
      els.resolutionPreset.value = "custom";
    }
    if (els.lockAspectRatio.checked) {
      els.outputHeight.value = String(Math.round(toNumber(event.target.value, 960) / getAspectRatio()));
    }
    updateWorkspace();
  });

  els.outputHeight.addEventListener("input", (event) => {
    if (els.resolutionPreset.value !== "custom") {
      els.resolutionPreset.value = "custom";
    }
    if (els.lockAspectRatio.checked) {
      els.outputWidth.value = String(Math.round(toNumber(event.target.value, 540) * getAspectRatio()));
    }
    updateWorkspace();
  });

  [
    els.globalSpeed,
    els.previewLoop,
    els.qualityLevel,
    els.loopMode,
    els.loopCount,
    els.transitionType,
    els.transitionSteps,
    els.lockAspectRatio
  ].forEach((element) => {
    element.addEventListener("input", updateWorkspace);
    element.addEventListener("change", updateWorkspace);
  });

  els.generateGif.addEventListener("click", async () => {
    try {
      const blob = await generateGifBlob();
      if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
      state.objectUrl = URL.createObjectURL(blob);
      els.downloadGif.href = state.objectUrl;
      els.downloadGif.hidden = false;
      els.downloadGif.download = `mediatoolspro-gif-${Date.now()}.gif`;
      els.progressBar.style.width = "100%";
      els.progressText.textContent = "GIF ready to download.";
      updateExportSummary(blob);
      setStatus("GIF generated successfully. Download is ready.");
    } catch (error) {
      els.progressText.textContent = error.message;
      setStatus(error.message);
      els.generateGif.disabled = false;
    }
  });

  updateExportSummary();
  syncFrameControls();
  syncLayerControls();
  renderPreviewFrame();
  requestAnimationFrame(tickPreview);
}
