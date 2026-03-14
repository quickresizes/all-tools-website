(() => {
  const app = document.getElementById("meme-tool-app");
  if (!app) return;

  const canvas = document.getElementById("meme-canvas");
  const ctx = canvas.getContext("2d");
  const uploadInput = document.getElementById("meme-upload");
  const templateSelect = document.getElementById("template-select");
  const templateSearch = document.getElementById("template-search");
  const layerList = document.getElementById("layer-list");
  const stickerPanel = document.getElementById("sticker-panel");
  const suggestionsEl = document.getElementById("caption-suggestions");
  const statusEl = document.getElementById("meme-status");
  const historyEl = document.getElementById("meme-history");
  const dropzone = document.getElementById("meme-dropzone");

  const templates = [
    { name: "Distracted Boyfriend", url: "https://i.imgflip.com/1ur9b0.jpg", suggestions: ["When you should sleep but open one more tab", "Me ignoring deadlines for side projects", "Focus? Never heard of it"] },
    { name: "Drake Hotline Bling", url: "https://i.imgflip.com/30b1gx.jpg", suggestions: ["Writing docs ❌", "Shipping features ✅", "Meeting all day ❌", "Building meme tools ✅"] },
    { name: "Two Buttons", url: "https://i.imgflip.com/1g8my4.jpg", suggestions: ["Refactor everything", "Meet deadline", "Me deciding at 2AM"] },
    { name: "Change My Mind", url: "https://i.imgflip.com/24y43o.jpg", suggestions: ["Frontend bugs are just personality", "Coffee is a dependency", "Semicolons are optional"] },
    { name: "Expanding Brain", url: "https://i.imgflip.com/1jwhww.jpg", suggestions: ["Copy paste", "StackOverflow", "Read docs", "Actually understand the code"] },
    { name: "Success Kid", url: "https://i.imgflip.com/1bhk.jpg", suggestions: ["Deploy succeeded", "No hotfix needed", "Friday saved"] },
    { name: "Woman Yelling at Cat", url: "https://i.imgflip.com/345v97.jpg", suggestions: ["Team in meeting", "Bug in production", "Cat: works on my machine"] }
  ];

  const stickers = ["😂", "🔥", "💀", "💯", "🤯", "😎", "🙌", "👉", "⬅️", "⬆️", "⬇️", "⭐", "❤️", "⚠️", "❌", "✅", "🎉", "🚀", "🎯", "🤣", "⭕", "⬛", "🔺", "🔵", "💬"];

  const inputs = {
    addTextLayer: document.getElementById("add-text-layer"),
    layerText: document.getElementById("layer-text"),
    fontSize: document.getElementById("font-size"),
    fontFamily: document.getElementById("font-family"),
    textColor: document.getElementById("text-color"),
    outlineColor: document.getElementById("outline-color"),
    outlineWidth: document.getElementById("outline-width"),
    shadowStrength: document.getElementById("shadow-strength"),
    textAlign: document.getElementById("text-align"),
    rotation: document.getElementById("layer-rotation"),
    scale: document.getElementById("layer-scale"),
    uppercase: document.getElementById("uppercase-toggle"),
    deleteLayer: document.getElementById("delete-layer"),
    brightness: document.getElementById("brightness"),
    contrast: document.getElementById("contrast"),
    saturation: document.getElementById("saturation"),
    blur: document.getElementById("blur"),
    cropX: document.getElementById("crop-x"),
    cropY: document.getElementById("crop-y"),
    cropW: document.getElementById("crop-w"),
    cropH: document.getElementById("crop-h"),
    rotateLeft: document.getElementById("rotate-left"),
    rotateRight: document.getElementById("rotate-right"),
    flipX: document.getElementById("flip-x"),
    flipY: document.getElementById("flip-y"),
    resetEdits: document.getElementById("reset-image-edits"),
    aiCaption: document.getElementById("ai-caption-btn"),
    randomMeme: document.getElementById("random-meme-btn"),
    sizePreset: document.getElementById("size-preset"),
    format: document.getElementById("download-format"),
    download: document.getElementById("download-meme")
  };

  const state = {
    image: null,
    template: null,
    layers: [],
    selectedLayerId: null,
    imageEdits: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      rotate: 0,
      flipX: false,
      flipY: false,
      cropX: 0,
      cropY: 0,
      cropW: 100,
      cropH: 100
    }
  };

  let isDragging = false;
  let dragLayerId = null;
  let dragOffset = { x: 0, y: 0 };

  const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const getLayerById = (id) => state.layers.find((layer) => layer.id === id);

  const setStatus = (msg) => {
    statusEl.textContent = msg;
  };

  const setupTemplates = () => {
    templateSelect.innerHTML = "<option value=''>Choose meme template</option>";
    templates.forEach((template, index) => {
      const opt = document.createElement("option");
      opt.value = String(index);
      opt.textContent = template.name;
      templateSelect.appendChild(opt);
    });
  };

  const setupStickers = () => {
    stickerPanel.innerHTML = "";
    stickers.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sticker-btn";
      btn.textContent = s;
      btn.addEventListener("click", () => addStickerLayer(s));
      stickerPanel.appendChild(btn);
    });
  };

  const normalizeLayerText = (layer) => {
    if (layer.type !== "text") return layer.text;
    return layer.uppercase ? layer.text.toUpperCase() : layer.text;
  };

  const renderLayerList = () => {
    layerList.innerHTML = "";
    state.layers.forEach((layer, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `layer-item ${layer.id === state.selectedLayerId ? "active" : ""}`;
      item.textContent = `${index + 1}. ${layer.type === "text" ? (layer.text || "Text layer") : `Sticker ${layer.text}`}`;
      item.addEventListener("click", () => {
        state.selectedLayerId = layer.id;
        hydrateLayerControls();
        renderLayerList();
        render();
      });
      layerList.appendChild(item);
    });
  };

  const renderSuggestions = () => {
    suggestionsEl.innerHTML = "";
    const suggestions = state.template?.suggestions || [
      "When code compiles on first try",
      "One more deploy before lunch",
      "This meme writes itself"
    ];
    suggestions.forEach((text) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggestion-chip";
      button.textContent = text;
      button.addEventListener("click", () => {
        const layer = getLayerById(state.selectedLayerId) || createTextLayer(text);
        layer.text = text;
        if (!state.selectedLayerId) state.selectedLayerId = layer.id;
        hydrateLayerControls();
        renderLayerList();
        render();
      });
      suggestionsEl.appendChild(button);
    });
  };

  const createTextLayer = (text = "TOP TEXT") => {
    const layer = {
      id: makeId(),
      type: "text",
      text,
      x: 0.5,
      y: 0.2,
      fontSize: 56,
      fontFamily: "Impact",
      color: "#ffffff",
      outlineColor: "#000000",
      outlineWidth: 6,
      shadow: 8,
      align: "center",
      rotation: 0,
      scale: 1,
      uppercase: true
    };
    state.layers.push(layer);
    return layer;
  };

  const addStickerLayer = (emoji) => {
    const layer = {
      id: makeId(),
      type: "sticker",
      text: emoji,
      x: 0.5,
      y: 0.7,
      fontSize: 96,
      fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
      color: "#ffffff",
      outlineColor: "#000000",
      outlineWidth: 0,
      shadow: 0,
      align: "center",
      rotation: 0,
      scale: 1,
      uppercase: false
    };
    state.layers.push(layer);
    state.selectedLayerId = layer.id;
    hydrateLayerControls();
    renderLayerList();
    render();
  };

  const hydrateLayerControls = () => {
    const layer = getLayerById(state.selectedLayerId);
    const disabled = !layer;

    [
      inputs.layerText,
      inputs.fontSize,
      inputs.fontFamily,
      inputs.textColor,
      inputs.outlineColor,
      inputs.outlineWidth,
      inputs.shadowStrength,
      inputs.textAlign,
      inputs.rotation,
      inputs.scale,
      inputs.uppercase,
      inputs.deleteLayer
    ].forEach((el) => { if (el) el.disabled = disabled; });

    if (!layer) return;
    inputs.layerText.value = layer.text;
    inputs.fontSize.value = String(layer.fontSize);
    inputs.fontFamily.value = layer.fontFamily;
    inputs.textColor.value = layer.color;
    inputs.outlineColor.value = layer.outlineColor;
    inputs.outlineWidth.value = String(layer.outlineWidth);
    inputs.shadowStrength.value = String(layer.shadow);
    inputs.textAlign.value = layer.align;
    inputs.rotation.value = String(layer.rotation);
    inputs.scale.value = String(Math.round(layer.scale * 100));
    inputs.uppercase.checked = !!layer.uppercase;
  };

  const updateLayer = (callback) => {
    const layer = getLayerById(state.selectedLayerId);
    if (!layer) return;
    callback(layer);
    renderLayerList();
    render();
  };

  const loadImageFromUrl = async (url) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    await image.decode();
    state.image = image;
    render();
  };

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setStatus("Unsupported file type. Please use JPG, JPEG, PNG, WEBP, or GIF.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        state.image = image;
        state.template = null;
        setStatus(`Loaded ${file.name}. Drag any layer on the canvas.`);
        render();
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const applyPresetSize = () => {
    const preset = inputs.sizePreset.value;
    if (preset === "custom") return;
    const [w, h] = preset.split("x").map((n) => Number.parseInt(n, 10));
    canvas.width = w;
    canvas.height = h;
    render();
  };

  const drawBaseImage = () => {
    if (!state.image) {
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "700 38px Poppins, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Upload an image or select a meme template", canvas.width / 2, canvas.height / 2);
      return;
    }

    const { brightness, contrast, saturation, blur, rotate, flipX, flipY, cropX, cropY, cropW, cropH } = state.imageEdits;
    const sx = (cropX / 100) * state.image.width;
    const sy = (cropY / 100) * state.image.height;
    const sw = Math.max(1, (cropW / 100) * state.image.width);
    const sh = Math.max(1, (cropH / 100) * state.image.height);

    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

    const imageRatio = sw / sh;
    const canvasRatio = canvas.width / canvas.height;
    let drawW = canvas.width;
    let drawH = canvas.height;

    if (imageRatio > canvasRatio) drawH = drawW / imageRatio;
    else drawW = drawH * imageRatio;

    ctx.drawImage(state.image, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    ctx.filter = "none";
  };

  const drawLayers = () => {
    state.layers.forEach((layer) => {
      const text = normalizeLayerText(layer);
      const x = layer.x * canvas.width;
      const y = layer.y * canvas.height;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.scale, layer.scale);
      ctx.textAlign = layer.align;
      ctx.textBaseline = "middle";
      ctx.font = `700 ${layer.fontSize}px ${layer.fontFamily}, sans-serif`;
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = layer.shadow;

      if (layer.outlineWidth > 0) {
        ctx.strokeStyle = layer.outlineColor;
        ctx.lineWidth = layer.outlineWidth;
        ctx.strokeText(text, 0, 0);
      }
      ctx.fillStyle = layer.color;
      ctx.fillText(text, 0, 0);
      ctx.restore();

      if (layer.id === state.selectedLayerId) {
        ctx.save();
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        const width = ctx.measureText(text).width * layer.scale;
        const boxHeight = layer.fontSize * 1.4 * layer.scale;
        const left = x - width / 2;
        const top = y - boxHeight / 2;
        ctx.strokeRect(left, top, width, boxHeight);
        ctx.restore();
      }
    });
  };

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBaseImage();
    drawLayers();
  };

  const detectLayerAtPosition = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    for (let i = state.layers.length - 1; i >= 0; i -= 1) {
      const layer = state.layers[i];
      const text = normalizeLayerText(layer);
      ctx.font = `700 ${layer.fontSize}px ${layer.fontFamily}, sans-serif`;
      const width = ctx.measureText(text).width * layer.scale;
      const height = layer.fontSize * 1.4 * layer.scale;
      const lx = layer.x * canvas.width;
      const ly = layer.y * canvas.height;
      if (x >= lx - width / 2 && x <= lx + width / 2 && y >= ly - height / 2 && y <= ly + height / 2) {
        return { layer, x, y };
      }
    }
    return null;
  };

  const handlePointerDown = (e) => {
    const hit = detectLayerAtPosition(e.clientX, e.clientY);
    if (!hit) return;
    state.selectedLayerId = hit.layer.id;
    isDragging = true;
    dragLayerId = hit.layer.id;
    dragOffset.x = hit.x - hit.layer.x * canvas.width;
    dragOffset.y = hit.y - hit.layer.y * canvas.height;
    hydrateLayerControls();
    renderLayerList();
    render();
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !dragLayerId) return;
    const layer = getLayerById(dragLayerId);
    if (!layer) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width - dragOffset.x;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height - dragOffset.y;
    layer.x = Math.min(1, Math.max(0, x / canvas.width));
    layer.y = Math.min(1, Math.max(0, y / canvas.height));
    render();
  };

  const handlePointerUp = () => {
    isDragging = false;
    dragLayerId = null;
  };

  const buildCaption = () => {
    const openers = ["When", "POV:", "Me after", "Nobody:", "Meanwhile", "Breaking:"];
    const subjects = ["the bug", "my Wi-Fi", "the deadline", "my code", "the build", "production"];
    const endings = ["still passes tests", "at 2AM", "right before launch", "for no reason", "on Friday", "after one tiny change"];
    return `${randomPick(openers)} ${randomPick(subjects)} ${randomPick(endings)}`;
  };

  const addAICaption = () => {
    const caption = state.template?.suggestions?.[Math.floor(Math.random() * state.template.suggestions.length)] || buildCaption();
    const layer = createTextLayer(caption);
    layer.y = 0.85;
    state.selectedLayerId = layer.id;
    hydrateLayerControls();
    renderLayerList();
    render();
  };

  const saveHistory = () => {
    try {
      const existing = JSON.parse(localStorage.getItem("meme-history") || "[]");
      const entry = { dataUrl: canvas.toDataURL("image/png"), ts: Date.now() };
      const next = [entry, ...existing].slice(0, 5);
      localStorage.setItem("meme-history", JSON.stringify(next));
      renderHistory();
    } catch {
      setStatus("Could not save meme history due to storage limitations.");
    }
  };

  const renderHistory = () => {
    historyEl.innerHTML = "";
    const history = JSON.parse(localStorage.getItem("meme-history") || "[]");
    history.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "history-item";
      button.innerHTML = `<img src="${item.dataUrl}" alt="Meme history item" />`;
      button.addEventListener("click", () => {
        const img = new Image();
        img.onload = () => {
          state.image = img;
          state.layers = [];
          state.selectedLayerId = null;
          renderLayerList();
          hydrateLayerControls();
          render();
        };
        img.src = item.dataUrl;
      });
      historyEl.appendChild(button);
    });
  };

  const downloadMeme = () => {
    const format = inputs.format.value;
    const mime = format === "jpg" ? "image/jpeg" : `image/${format}`;
    const link = document.createElement("a");
    link.href = canvas.toDataURL(mime, 0.92);
    link.download = `meme-${Date.now()}.${format}`;
    link.click();
    saveHistory();
  };

  inputs.addTextLayer.addEventListener("click", () => {
    const layer = createTextLayer("TOP TEXT");
    state.selectedLayerId = layer.id;
    hydrateLayerControls();
    renderLayerList();
    render();
  });

  inputs.deleteLayer.addEventListener("click", () => {
    if (!state.selectedLayerId) return;
    state.layers = state.layers.filter((layer) => layer.id !== state.selectedLayerId);
    state.selectedLayerId = state.layers.at(-1)?.id || null;
    hydrateLayerControls();
    renderLayerList();
    render();
  });

  inputs.layerText.addEventListener("input", (e) => updateLayer((layer) => { layer.text = e.target.value; }));
  inputs.fontSize.addEventListener("input", (e) => updateLayer((layer) => { layer.fontSize = Number.parseInt(e.target.value, 10); }));
  inputs.fontFamily.addEventListener("change", (e) => updateLayer((layer) => { layer.fontFamily = e.target.value; }));
  inputs.textColor.addEventListener("input", (e) => updateLayer((layer) => { layer.color = e.target.value; }));
  inputs.outlineColor.addEventListener("input", (e) => updateLayer((layer) => { layer.outlineColor = e.target.value; }));
  inputs.outlineWidth.addEventListener("input", (e) => updateLayer((layer) => { layer.outlineWidth = Number.parseInt(e.target.value, 10); }));
  inputs.shadowStrength.addEventListener("input", (e) => updateLayer((layer) => { layer.shadow = Number.parseInt(e.target.value, 10); }));
  inputs.textAlign.addEventListener("change", (e) => updateLayer((layer) => { layer.align = e.target.value; }));
  inputs.rotation.addEventListener("input", (e) => updateLayer((layer) => { layer.rotation = Number.parseInt(e.target.value, 10); }));
  inputs.scale.addEventListener("input", (e) => updateLayer((layer) => { layer.scale = Number.parseInt(e.target.value, 10) / 100; }));
  inputs.uppercase.addEventListener("change", (e) => updateLayer((layer) => { layer.uppercase = e.target.checked; }));

  ["brightness", "contrast", "saturation", "blur", "cropX", "cropY", "cropW", "cropH"].forEach((key) => {
    const element = inputs[key];
    element.addEventListener("input", (e) => {
      state.imageEdits[key] = Number.parseInt(e.target.value, 10);
      render();
    });
  });

  inputs.rotateLeft.addEventListener("click", () => { state.imageEdits.rotate -= 90; render(); });
  inputs.rotateRight.addEventListener("click", () => { state.imageEdits.rotate += 90; render(); });
  inputs.flipX.addEventListener("click", () => { state.imageEdits.flipX = !state.imageEdits.flipX; render(); });
  inputs.flipY.addEventListener("click", () => { state.imageEdits.flipY = !state.imageEdits.flipY; render(); });
  inputs.resetEdits.addEventListener("click", () => {
    Object.assign(state.imageEdits, {
      brightness: 100, contrast: 100, saturation: 100, blur: 0,
      rotate: 0, flipX: false, flipY: false, cropX: 0, cropY: 0, cropW: 100, cropH: 100
    });
    Object.entries({ brightness: 100, contrast: 100, saturation: 100, blur: 0, cropX: 0, cropY: 0, cropW: 100, cropH: 100 }).forEach(([key, val]) => {
      inputs[key].value = String(val);
    });
    render();
  });

  inputs.aiCaption.addEventListener("click", addAICaption);
  inputs.randomMeme.addEventListener("click", async () => {
    const template = randomPick(templates);
    templateSelect.value = String(templates.findIndex((t) => t.name === template.name));
    state.template = template;
    renderSuggestions();
    try {
      await loadImageFromUrl(template.url);
      state.layers = [];
      const top = createTextLayer(buildCaption());
      top.y = 0.15;
      const bottom = createTextLayer(buildCaption());
      bottom.y = 0.88;
      state.selectedLayerId = bottom.id;
      hydrateLayerControls();
      renderLayerList();
      setStatus(`Randomized with ${template.name}`);
      render();
    } catch {
      setStatus("Could not load random template right now.");
    }
  });

  inputs.sizePreset.addEventListener("change", applyPresetSize);
  inputs.download.addEventListener("click", downloadMeme);

  uploadInput.addEventListener("change", (e) => handleFile(e.target.files?.[0]));
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add("active");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove("active");
    });
  });
  dropzone.addEventListener("drop", (e) => handleFile(e.dataTransfer.files?.[0]));

  templateSelect.addEventListener("change", async (e) => {
    const idx = Number.parseInt(e.target.value, 10);
    const template = templates[idx];
    if (!template) return;
    state.template = template;
    renderSuggestions();
    setStatus(`Loading template: ${template.name}`);
    try {
      await loadImageFromUrl(template.url);
      setStatus(`Template ready: ${template.name}`);
    } catch {
      setStatus("Template could not be loaded. Try another template or upload an image.");
    }
  });

  templateSearch.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    templateSelect.innerHTML = "<option value=''>Choose meme template</option>";
    templates
      .map((template, index) => ({ template, index }))
      .filter(({ template }) => template.name.toLowerCase().includes(q))
      .forEach(({ template, index }) => {
        const opt = document.createElement("option");
        opt.value = String(index);
        opt.textContent = template.name;
        templateSelect.appendChild(opt);
      });
  });

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointerleave", handlePointerUp);

  setupTemplates();
  setupStickers();
  renderSuggestions();
  renderHistory();
  hydrateLayerControls();
  render();
})();
