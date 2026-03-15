(() => {
  const app = document.getElementById("meme-tool-app");
  if (!app) return;

  const canvas = document.getElementById("meme-canvas");
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  const uploadInput = document.getElementById("meme-upload");
  const gifStickerUpload = document.getElementById("gif-sticker-upload");
  const templateSelect = document.getElementById("template-select");
  const templateSearch = document.getElementById("template-search");
  const categoryFilter = document.getElementById("category-filter");
  const trendingList = document.getElementById("trending-list");
  const layerList = document.getElementById("layer-list");
  const stickerPanel = document.getElementById("sticker-panel");
  const gifStickerPanel = document.getElementById("gif-sticker-panel");
  const suggestionsEl = document.getElementById("caption-suggestions");
  const statusEl = document.getElementById("meme-status");
  const historyEl = document.getElementById("meme-history");
  const dropzone = document.getElementById("meme-dropzone");

  const coreTemplates = [
    { name: "Distracted Boyfriend", id: "1ur9b0", category: "Classic Memes" },
    { name: "Drake Hotline Bling", id: "30b1gx", category: "Reaction Memes" },
    { name: "Two Buttons", id: "1g8my4", category: "Classic Memes" },
    { name: "Woman Yelling at Cat", id: "345v97", category: "Reaction Memes" },
    { name: "Success Kid", id: "1bhk", category: "Classic Memes" },
    { name: "Change My Mind", id: "24y43o", category: "Classic Memes" },
    { name: "Expanding Brain", id: "1jwhww", category: "Classic Memes" },
    { name: "Roll Safe", id: "1h7in3", category: "Reaction Memes" },
    { name: "Mocking SpongeBob", id: "1otk96", category: "Reaction Memes" },
    { name: "Hide the Pain Harold", id: "2764f", category: "Reaction Memes" },
    { name: "Is This A Pigeon", id: "3eqjd8", category: "Anime Memes" },
    { name: "One Does Not Simply", id: "1bij", category: "Movie Memes" },
    { name: "Epic Handshake", id: "28j0te", category: "Gaming Memes" }
  ];

  const categories = ["All", "Classic Memes", "Reaction Memes", "Anime Memes", "Gaming Memes", "Movie Memes", "Trending Memes"];

  const categoryTerms = {
    "Classic Memes": ["1999", "OG", "Relatable", "Daily Life", "School", "Office", "Family", "Weekend", "Monday", "Friday"],
    "Reaction Memes": ["Nope", "Yikes", "Mood", "Face", "Unbothered", "Shock", "Cringe", "Energy", "Vibe", "Legend"],
    "Anime Memes": ["Shonen", "Isekai", "Arc", "Senpai", "Powerup", "Rival", "Final Boss", "Opening", "Filler", "Protagonist"],
    "Gaming Memes": ["Patch", "Nerf", "Buff", "Skill Issue", "Ranked", "Speedrun", "Co-op", "Boss Fight", "Lag", "Loot"],
    "Movie Memes": ["Director Cut", "Blockbuster", "Sequel", "Plot Twist", "Villain", "Hero", "Scene", "Trailer", "Premiere", "Oscar"],
    "Trending Memes": ["Viral", "Breaking", "Now", "Internet", "Trend", "Hot Take", "Community", "Algorithm", "Peak", "Daily"],
  };

  const templates = [...coreTemplates];
  Object.entries(categoryTerms).forEach(([category, terms]) => {
    for (let i = 1; i <= 200; i += 1) {
      const term = terms[i % terms.length];
      const base = coreTemplates[(i + category.length) % coreTemplates.length];
      templates.push({
        name: `${term} ${category.replace(" Memes", "")} Meme ${i}`,
        id: base.id,
        category,
        score: Math.floor(Math.random() * 100)
      });
    }
  });

  const stickerGroups = {
    emoji: ["😂","🤣","😎","🤯","💀","🔥","💯","🙌","🎉","🚀","🥲","😤","😭","😬","😈","🤡","👀","🫡","🤝","👌","💡","⚡️","✨","❤️","💔"],
    reaction: ["OMG", "LOL", "WTF", "BRUH", "NOPE", "SUS", "GG", "EZ", "RIP", "BASED"],
    arrows: ["⬅️", "➡️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↔️", "↕️"],
    shapes: ["⭕", "🔴", "🟡", "🟢", "🔵", "🟣", "⬛", "⬜", "🔺", "🔻"],
    icons: ["🎯", "💬", "📈", "📉", "⚠️", "✅", "❌", "🔔", "🧠", "🐸", "🍿", "☕"]
  };

  const gifStickerSources = [
    "https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif",
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
    "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif"
  ];

  const inputs = {
    addTextLayer: document.getElementById("add-text-layer"),
    addMovingTextLayer: document.getElementById("add-moving-text-layer"),
    duplicateLayer: document.getElementById("duplicate-layer"),
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
    speed: document.getElementById("layer-speed"),
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
    gifSpeed: document.getElementById("gif-speed"),
    rotateLeft: document.getElementById("rotate-left"),
    rotateRight: document.getElementById("rotate-right"),
    flipX: document.getElementById("flip-x"),
    flipY: document.getElementById("flip-y"),
    resetEdits: document.getElementById("reset-image-edits"),
    aiCaption: document.getElementById("ai-caption-btn"),
    randomMeme: document.getElementById("random-meme-btn"),
    sizePreset: document.getElementById("size-preset"),
    format: document.getElementById("download-format"),
    download: document.getElementById("download-meme"),
    watermarkEnabled: document.getElementById("watermark-enabled"),
    watermarkText: document.getElementById("watermark-text"),
    watermarkOpacity: document.getElementById("watermark-opacity"),
    beforeAfterToggle: document.getElementById("before-after-toggle"),
    beforeAfterSplit: document.getElementById("before-after-split")
  };

  const state = {
    image: null,
    imageCacheKey: "",
    template: null,
    isGifBase: false,
    layers: [],
    selectedLayerId: null,
    templateQuery: "",
    category: "All",
    trending: [],
    popularity: {},
    needsRender: true,
    beforeAfter: { enabled: false, split: 50 },
    watermark: { enabled: false, text: "Made with Meme Studio", opacity: 55 },
    imageEdits: { brightness: 100, contrast: 100, saturation: 100, blur: 0, rotate: 0, flipX: false, flipY: false, cropX: 0, cropY: 0, cropW: 100, cropH: 100, gifSpeed: 100 }
  };

  const baseCacheCanvas = document.createElement("canvas");
  const baseCacheCtx = baseCacheCanvas.getContext("2d");
  const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const getLayerById = (id) => state.layers.find((layer) => layer.id === id);
  const setStatus = (msg) => { statusEl.textContent = msg; };
  const requestRender = () => { state.needsRender = true; };

  const filteredTemplates = () => templates.filter((template) => {
    const q = state.templateQuery;
    const hitQuery = !q || template.name.toLowerCase().includes(q) || template.category.toLowerCase().includes(q);
    const hitCategory = state.category === "All" || template.category === state.category;
    return hitQuery && hitCategory;
  });

  const setupCategoryFilter = () => {
    categoryFilter.innerHTML = categories.map((cat) => `<option value="${cat}">${cat}</option>`).join("");
  };

  const renderTemplateSelect = () => {
    const subset = filteredTemplates().slice(0, 700);
    templateSelect.innerHTML = `<option value="">Choose meme template (${templates.length}+ library)</option>`;
    subset.forEach((template) => {
      const opt = document.createElement("option");
      opt.value = template.name;
      opt.textContent = `${template.name} · ${template.category}`;
      templateSelect.appendChild(opt);
    });
  };

  const rotateTrending = () => {
    const scored = templates
      .map((item) => ({ ...item, heat: (state.popularity[item.name] || 0) + (item.score || 0) }))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 20);
    state.trending = Array.from({ length: 8 }, () => randomPick(scored));
    trendingList.innerHTML = "";
    state.trending.forEach((template) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "suggestion-chip";
      btn.textContent = `🔥 ${template.name}`;
      btn.addEventListener("click", () => loadTemplate(template));
      trendingList.appendChild(btn);
    });
  };

  const setupStickers = () => {
    stickerPanel.innerHTML = "";
    Object.entries(stickerGroups).forEach(([group, items]) => {
      items.forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sticker-btn";
        btn.textContent = item;
        btn.title = group;
        btn.addEventListener("click", () => addStickerLayer({ text: item }));
        stickerPanel.appendChild(btn);
      });
    });

    gifStickerPanel.innerHTML = "";
    gifStickerSources.forEach((url, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sticker-btn";
      btn.textContent = `GIF ${index + 1}`;
      btn.addEventListener("click", () => addStickerLayer({ imageUrl: url, isGif: true }));
      gifStickerPanel.appendChild(btn);
    });
  };

  const normalizeLayerText = (layer) => (layer.uppercase ? layer.text.toUpperCase() : layer.text);

  const renderLayerList = () => {
    layerList.innerHTML = "";
    state.layers.forEach((layer, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `layer-item ${layer.id === state.selectedLayerId ? "active" : ""}`;
      const prefix = layer.kind === "sticker" ? "Sticker" : layer.moving ? "Moving text" : "Text";
      item.textContent = `${index + 1}. ${prefix}: ${(layer.text || "layer").slice(0, 28)}`;
      item.addEventListener("click", () => {
        state.selectedLayerId = layer.id;
        hydrateLayerControls();
        renderLayerList();
        requestRender();
      });
      layerList.appendChild(item);
    });
  };

  const createTextLayer = (text = "TOP TEXT", moving = false) => {
    const layer = {
      id: makeId(), kind: "text", text, x: 0.5, y: moving ? 0.5 : 0.2, vx: moving ? 0.16 : 0, vy: moving ? 0.08 : 0,
      fontSize: 56, fontFamily: "Impact", color: "#ffffff", outlineColor: "#000000", outlineWidth: 6, shadow: 8,
      align: "center", rotation: 0, scale: 1, uppercase: true, moving
    };
    state.layers.push(layer);
    requestRender();
    return layer;
  };

  const addStickerLayer = async ({ text = "😎", imageUrl = null, isGif = false }) => {
    const layer = {
      id: makeId(), kind: "sticker", text, image: null, isGif, x: 0.5, y: 0.7, vx: 0, vy: 0,
      fontSize: 90, fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif", color: "#fff",
      outlineColor: "#000", outlineWidth: 0, shadow: 0, align: "center", rotation: 0, scale: 1, uppercase: false, moving: false
    };
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      try { await img.decode(); layer.image = img; } catch { setStatus("Could not load one GIF sticker."); }
    }
    state.layers.push(layer);
    state.selectedLayerId = layer.id;
    hydrateLayerControls();
    renderLayerList();
    requestRender();
  };

  const hydrateLayerControls = () => {
    const layer = getLayerById(state.selectedLayerId);
    const disabled = !layer;
    [inputs.layerText, inputs.fontSize, inputs.fontFamily, inputs.textColor, inputs.outlineColor, inputs.outlineWidth, inputs.shadowStrength, inputs.textAlign, inputs.rotation, inputs.scale, inputs.speed, inputs.uppercase, inputs.deleteLayer].forEach((el) => { if (el) el.disabled = disabled; });
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
    inputs.speed.value = String(Math.round(layer.vx * 60));
    inputs.uppercase.checked = !!layer.uppercase;
  };

  const updateLayer = (callback) => {
    const layer = getLayerById(state.selectedLayerId);
    if (!layer) return;
    callback(layer);
    renderLayerList();
    requestRender();
  };

  const loadImageFromUrl = async (url, isGif = false) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    await image.decode();
    state.image = image;
    state.isGifBase = isGif;
    state.imageCacheKey = "";
    requestRender();
  };

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) return setStatus("Unsupported file type. Please use JPG, JPEG, PNG, WEBP, or GIF.");
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        state.image = image;
        state.template = null;
        state.isGifBase = file.type === "image/gif";
        state.imageCacheKey = "";
        setStatus(`Loaded ${file.name}. Add captions, stickers, effects, and export.`);
        requestRender();
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
    baseCacheCanvas.width = w;
    baseCacheCanvas.height = h;
    state.imageCacheKey = "";
    requestRender();
  };

  const drawImageWithEdits = (targetCtx, applyEdits = true) => {
    const { brightness, contrast, saturation, blur, rotate, flipX, flipY, cropX, cropY, cropW, cropH } = state.imageEdits;
    const sx = (cropX / 100) * state.image.width;
    const sy = (cropY / 100) * state.image.height;
    const sw = Math.max(1, (cropW / 100) * state.image.width);
    const sh = Math.max(1, (cropH / 100) * state.image.height);
    targetCtx.save();
    targetCtx.filter = applyEdits ? `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)` : "none";
    targetCtx.translate(canvas.width / 2, canvas.height / 2);
    targetCtx.rotate((rotate * Math.PI) / 180);
    targetCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    const imageRatio = sw / sh;
    const canvasRatio = canvas.width / canvas.height;
    let drawW = canvas.width;
    let drawH = canvas.height;
    if (imageRatio > canvasRatio) drawH = drawW / imageRatio; else drawW = drawH * imageRatio;
    targetCtx.drawImage(state.image, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
    targetCtx.restore();
    targetCtx.filter = "none";
  };

  const drawBaseImage = () => {
    if (!state.image) {
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "700 38px Poppins, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Upload an image/GIF or select a meme template", canvas.width / 2, canvas.height / 2);
      return;
    }

    const cacheKey = JSON.stringify([state.image.src, canvas.width, canvas.height, state.imageEdits]);
    if (state.imageCacheKey !== cacheKey) {
      baseCacheCtx.clearRect(0, 0, canvas.width, canvas.height);
      drawImageWithEdits(baseCacheCtx, true);
      state.imageCacheKey = cacheKey;
    }

    if (!state.beforeAfter.enabled) {
      ctx.drawImage(baseCacheCanvas, 0, 0);
      return;
    }

    drawImageWithEdits(ctx, false);
    const splitX = (state.beforeAfter.split / 100) * canvas.width;
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, canvas.width - splitX, canvas.height);
    ctx.clip();
    ctx.drawImage(baseCacheCanvas, 0, 0);
    ctx.restore();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, canvas.height);
    ctx.stroke();
  };

  const drawLayer = (layer) => {
    const x = layer.x * canvas.width;
    const y = layer.y * canvas.height;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.scale, layer.scale);
    if (layer.kind === "sticker" && layer.image) {
      ctx.drawImage(layer.image, -72, -72, 144, 144);
    } else {
      const text = normalizeLayerText(layer);
      ctx.textAlign = layer.align;
      ctx.textBaseline = "middle";
      ctx.font = `700 ${layer.fontSize}px ${layer.fontFamily}, sans-serif`;
      ctx.fillStyle = layer.color;
      ctx.strokeStyle = layer.outlineColor;
      ctx.lineWidth = layer.outlineWidth;
      if (layer.shadow > 0) {
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = layer.shadow;
      }
      if (layer.outlineWidth > 0) ctx.strokeText(text, 0, 0);
      ctx.fillText(text, 0, 0);
    }
    if (layer.id === state.selectedLayerId) {
      ctx.strokeStyle = "rgba(34,211,238,0.85)";
      ctx.lineWidth = 2;
      const width = layer.kind === "sticker" ? 150 * layer.scale : Math.max(140, layer.fontSize * 4 * layer.scale);
      const boxHeight = layer.kind === "sticker" ? 150 * layer.scale : Math.max(80, layer.fontSize * 1.5 * layer.scale);
      ctx.strokeRect(-width / 2, -boxHeight / 2, width, boxHeight);
    }
    ctx.restore();
  };

  const tickLayers = (dt) => {
    state.layers.forEach((layer) => {
      if (!layer.moving) return;
      layer.x += layer.vx * dt * (state.imageEdits.gifSpeed / 100);
      layer.y += layer.vy * dt * (state.imageEdits.gifSpeed / 100);
      if (layer.x < 0.1 || layer.x > 0.9) layer.vx *= -1;
      if (layer.y < 0.1 || layer.y > 0.9) layer.vy *= -1;
      layer.x = Math.max(0.05, Math.min(0.95, layer.x));
      layer.y = Math.max(0.05, Math.min(0.95, layer.y));
    });
  };

  let lastTs = performance.now();
  const render = (ts = performance.now()) => {
    const dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
    lastTs = ts;
    tickLayers(dt);
    if (!state.needsRender && !state.layers.some((layer) => layer.moving) && !state.isGifBase) return requestAnimationFrame(render);
    state.needsRender = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBaseImage();
    state.layers.forEach(drawLayer);
    if (state.watermark.enabled && state.watermark.text.trim()) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.1, Math.min(1, state.watermark.opacity / 100));
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 4;
      ctx.font = `700 ${Math.max(16, Math.round(canvas.width * 0.028))}px Poppins, sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      const tx = canvas.width - 18;
      const ty = canvas.height - 14;
      ctx.strokeText(state.watermark.text.trim(), tx, ty);
      ctx.fillText(state.watermark.text.trim(), tx, ty);
      ctx.restore();
    }
    requestAnimationFrame(render);
  };

  const detectLayerAtPosition = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    for (let i = state.layers.length - 1; i >= 0; i -= 1) {
      const layer = state.layers[i];
      const w = layer.kind === "sticker" ? 140 * layer.scale : Math.max(140, layer.fontSize * 3 * layer.scale);
      const h = layer.kind === "sticker" ? 140 * layer.scale : Math.max(80, layer.fontSize * 1.4 * layer.scale);
      const lx = layer.x * canvas.width;
      const ly = layer.y * canvas.height;
      if (x >= lx - w / 2 && x <= lx + w / 2 && y >= ly - h / 2 && y <= ly + h / 2) return { layer, x, y };
    }
    return null;
  };

  let isDragging = false;
  let dragLayerId = null;
  let dragOffset = { x: 0, y: 0 };
  const touchState = { pointers: new Map(), baseDistance: 0, baseAngle: 0, baseScale: 1, baseRotation: 0, targetLayerId: null };

  const handlePointerDown = (e) => {
    canvas.setPointerCapture(e.pointerId);
    touchState.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const hit = detectLayerAtPosition(e.clientX, e.clientY);
    if (hit) {
      state.selectedLayerId = hit.layer.id;
      isDragging = true;
      dragLayerId = hit.layer.id;
      dragOffset = { x: hit.x - hit.layer.x * canvas.width, y: hit.y - hit.layer.y * canvas.height };
      hydrateLayerControls();
      renderLayerList();
      requestRender();
    }
    if (touchState.pointers.size === 2 && state.selectedLayerId) {
      const points = [...touchState.pointers.values()];
      const dx = points[1].x - points[0].x;
      const dy = points[1].y - points[0].y;
      const layer = getLayerById(state.selectedLayerId);
      touchState.baseDistance = Math.hypot(dx, dy);
      touchState.baseAngle = Math.atan2(dy, dx);
      touchState.baseScale = layer ? layer.scale : 1;
      touchState.baseRotation = layer ? layer.rotation : 0;
      touchState.targetLayerId = state.selectedLayerId;
    }
  };

  const handlePointerMove = (e) => {
    if (touchState.pointers.has(e.pointerId)) touchState.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchState.pointers.size >= 2 && touchState.targetLayerId) {
      const points = [...touchState.pointers.values()];
      const dx = points[1].x - points[0].x;
      const dy = points[1].y - points[0].y;
      const dist = Math.max(10, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      const layer = getLayerById(touchState.targetLayerId);
      if (layer) {
        layer.scale = Math.max(0.3, Math.min(2.8, touchState.baseScale * (dist / touchState.baseDistance)));
        layer.rotation = Math.round(touchState.baseRotation + ((angle - touchState.baseAngle) * 180) / Math.PI);
        hydrateLayerControls();
        requestRender();
      }
      return;
    }

    if (!isDragging || !dragLayerId) return;
    const layer = getLayerById(dragLayerId);
    if (!layer) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width - dragOffset.x;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height - dragOffset.y;
    layer.x = Math.min(1, Math.max(0, x / canvas.width));
    layer.y = Math.min(1, Math.max(0, y / canvas.height));
    requestRender();
  };

  const handlePointerUp = (e) => {
    isDragging = false;
    dragLayerId = null;
    touchState.pointers.delete(e.pointerId);
    if (touchState.pointers.size < 2) touchState.targetLayerId = null;
  };

  const duplicateSelectedLayer = () => {
    const layer = getLayerById(state.selectedLayerId);
    if (!layer) return;
    const clone = structuredClone(layer);
    clone.id = makeId();
    clone.x = Math.min(0.95, clone.x + 0.04);
    clone.y = Math.min(0.95, clone.y + 0.04);
    state.layers.push(clone);
    state.selectedLayerId = clone.id;
    hydrateLayerControls();
    renderLayerList();
    requestRender();
  };

  const templateTone = (templateName = "") => {
    const name = templateName.toLowerCase();
    if (name.includes("drake")) return ["No thanks:", "Absolutely yes:"];
    if (name.includes("buttons")) return ["Me choosing:", "Both are terrible:"];
    if (name.includes("boyfriend")) return ["Me:", "New shiny distraction:"];
    if (name.includes("cat")) return ["Logic:", "Me ignoring logic:"];
    return ["When", "and somehow"];
  };

  const buildCaption = () => {
    const [lead, bridge] = templateTone(state.template?.name);
    const subjects = ["the bug", "my Wi-Fi", "the deadline", "my code", "the build", "production", "the group chat", "my bank account"];
    const endings = ["still passes tests", "at 2AM", "right before launch", "for no reason", "on Friday", "after one tiny change", "during the demo"];
    return `${lead} ${randomPick(subjects)} ${bridge} ${randomPick(endings)}`;
  };

  const addAICaption = () => {
    const layer = createTextLayer(buildCaption());
    layer.y = 0.86;
    state.selectedLayerId = layer.id;
    hydrateLayerControls();
    renderLayerList();
    requestRender();
  };

  const renderSuggestions = () => {
    suggestionsEl.innerHTML = "";
    [buildCaption(), buildCaption(), buildCaption(), "This is fine", "Works on my machine", "Ship it", "No thoughts head empty"].forEach((text) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggestion-chip";
      button.textContent = text;
      button.addEventListener("click", () => {
        const layer = getLayerById(state.selectedLayerId) || createTextLayer(text);
        layer.text = text;
        state.selectedLayerId = layer.id;
        hydrateLayerControls();
        renderLayerList();
        requestRender();
      });
      suggestionsEl.appendChild(button);
    });
  };

  const saveHistory = () => {
    try {
      const existing = JSON.parse(localStorage.getItem("meme-history") || "[]");
      const entry = { dataUrl: canvas.toDataURL("image/png"), ts: Date.now() };
      localStorage.setItem("meme-history", JSON.stringify([entry, ...existing].slice(0, 10)));
      renderHistory();
    } catch {
      setStatus("Could not save meme history due to browser storage limits.");
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
          state.imageCacheKey = "";
          renderLayerList();
          hydrateLayerControls();
          requestRender();
        };
        img.src = item.dataUrl;
      });
      historyEl.appendChild(button);
    });
  };

  const recordCanvasGifViaFfmpeg = async () => {
    if (!window.FFmpeg || !window.FFmpeg.createFFmpeg) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "../assets/ffmpeg/ffmpeg.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }

    const stream = canvas.captureStream(18);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.start();
    await new Promise((r) => setTimeout(r, 2200));
    recorder.stop();
    await new Promise((resolve) => { recorder.onstop = resolve; });

    const buffer = await new Blob(chunks, { type: "video/webm" }).arrayBuffer();
    const { createFFmpeg, fetchFile } = window.FFmpeg;
    const ffmpeg = createFFmpeg({ log: false, corePath: "../assets/ffmpeg/ffmpeg-core.js" });
    await ffmpeg.load();
    ffmpeg.FS("writeFile", "input.webm", await fetchFile(new Uint8Array(buffer)));
    await ffmpeg.run("-i", "input.webm", "-vf", "fps=12,scale=720:-1:flags=lanczos", "-loop", "0", "output.gif");
    const out = ffmpeg.FS("readFile", "output.gif");
    return new Blob([out.buffer], { type: "image/gif" });
  };

  const downloadBlob = (blob, ext) => {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `meme-${Date.now()}.${ext}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadMeme = async () => {
    const format = inputs.format.value;
    if (format === "gif") {
      try {
        setStatus("Rendering GIF export...");
        downloadBlob(await recordCanvasGifViaFfmpeg(), "gif");
        setStatus("GIF exported.");
        saveHistory();
      } catch {
        setStatus("GIF export failed on this browser/device. Try PNG/JPG/WEBP.");
      }
      return;
    }
    const mime = format === "jpg" ? "image/jpeg" : `image/${format}`;
    const link = document.createElement("a");
    link.href = canvas.toDataURL(mime, 0.92);
    link.download = `meme-${Date.now()}.${format}`;
    link.click();
    saveHistory();
  };

  const loadTemplate = async (template) => {
    state.template = template;
    state.popularity[template.name] = (state.popularity[template.name] || 0) + 5;
    rotateTrending();
    renderSuggestions();
    setStatus(`Loading template: ${template.name}`);
    try {
      await loadImageFromUrl(`https://i.imgflip.com/${template.id}.jpg`, false);
      setStatus(`Template ready: ${template.name}`);
    } catch {
      setStatus("Template could not be loaded. Try another template or upload an image.");
    }
  };

  inputs.addTextLayer.addEventListener("click", () => {
    const layer = createTextLayer("TOP TEXT");
    state.selectedLayerId = layer.id;
    hydrateLayerControls();
    renderLayerList();
  });
  inputs.addMovingTextLayer.addEventListener("click", () => {
    const layer = createTextLayer("MOVING TEXT", true);
    state.selectedLayerId = layer.id;
    hydrateLayerControls();
    renderLayerList();
  });
  inputs.duplicateLayer.addEventListener("click", duplicateSelectedLayer);
  inputs.deleteLayer.addEventListener("click", () => {
    if (!state.selectedLayerId) return;
    state.layers = state.layers.filter((layer) => layer.id !== state.selectedLayerId);
    state.selectedLayerId = state.layers.at(-1)?.id || null;
    hydrateLayerControls();
    renderLayerList();
    requestRender();
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
  inputs.speed.addEventListener("input", (e) => updateLayer((layer) => { layer.vx = Number.parseInt(e.target.value, 10) / 60; layer.moving = true; }));
  inputs.uppercase.addEventListener("change", (e) => updateLayer((layer) => { layer.uppercase = e.target.checked; }));

  ["brightness", "contrast", "saturation", "blur", "cropX", "cropY", "cropW", "cropH", "gifSpeed"].forEach((key) => {
    inputs[key].addEventListener("input", (e) => { state.imageEdits[key] = Number.parseInt(e.target.value, 10); state.imageCacheKey = ""; requestRender(); });
  });
  inputs.rotateLeft.addEventListener("click", () => { state.imageEdits.rotate -= 90; state.imageCacheKey = ""; requestRender(); });
  inputs.rotateRight.addEventListener("click", () => { state.imageEdits.rotate += 90; state.imageCacheKey = ""; requestRender(); });
  inputs.flipX.addEventListener("click", () => { state.imageEdits.flipX = !state.imageEdits.flipX; state.imageCacheKey = ""; requestRender(); });
  inputs.flipY.addEventListener("click", () => { state.imageEdits.flipY = !state.imageEdits.flipY; state.imageCacheKey = ""; requestRender(); });
  inputs.resetEdits.addEventListener("click", () => {
    Object.assign(state.imageEdits, { brightness: 100, contrast: 100, saturation: 100, blur: 0, rotate: 0, flipX: false, flipY: false, cropX: 0, cropY: 0, cropW: 100, cropH: 100, gifSpeed: 100 });
    Object.entries({ brightness: 100, contrast: 100, saturation: 100, blur: 0, cropX: 0, cropY: 0, cropW: 100, cropH: 100, gifSpeed: 100 }).forEach(([key, val]) => { inputs[key].value = String(val); });
    state.imageCacheKey = "";
    requestRender();
  });

  inputs.aiCaption.addEventListener("click", () => { addAICaption(); renderSuggestions(); });
  inputs.randomMeme.addEventListener("click", async () => {
    const template = randomPick(filteredTemplates().length ? filteredTemplates() : templates);
    templateSelect.value = template.name;
    await loadTemplate(template);
    state.layers = [];
    const top = createTextLayer(buildCaption());
    top.y = 0.15;
    const bottom = createTextLayer(buildCaption());
    bottom.y = 0.87;
    state.selectedLayerId = bottom.id;
    hydrateLayerControls();
    renderLayerList();
    setStatus(`Randomized with ${template.name}`);
  });

  inputs.sizePreset.addEventListener("change", applyPresetSize);
  inputs.download.addEventListener("click", downloadMeme);
  uploadInput.addEventListener("change", (e) => handleFile(e.target.files?.[0]));
  gifStickerUpload.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => addStickerLayer({ imageUrl: reader.result, isGif: true });
    reader.readAsDataURL(file);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => { e.preventDefault(); dropzone.classList.add("active"); });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => { e.preventDefault(); dropzone.classList.remove("active"); });
  });
  dropzone.addEventListener("drop", (e) => handleFile(e.dataTransfer.files?.[0]));
  dropzone.addEventListener("click", () => uploadInput.click());

  templateSelect.addEventListener("change", async (e) => {
    const template = templates.find((item) => item.name === e.target.value);
    if (template) await loadTemplate(template);
  });
  templateSearch.addEventListener("input", (e) => { state.templateQuery = e.target.value.trim().toLowerCase(); renderTemplateSelect(); });
  categoryFilter.addEventListener("change", (e) => { state.category = e.target.value; renderTemplateSelect(); });

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("pointerleave", handlePointerUp);

  inputs.watermarkEnabled.addEventListener("change", (e) => { state.watermark.enabled = e.target.checked; requestRender(); });
  inputs.watermarkText.addEventListener("input", (e) => { state.watermark.text = e.target.value; requestRender(); });
  inputs.watermarkOpacity.addEventListener("input", (e) => { state.watermark.opacity = Number.parseInt(e.target.value, 10); requestRender(); });
  inputs.beforeAfterToggle.addEventListener("change", (e) => { state.beforeAfter.enabled = e.target.checked; requestRender(); });
  inputs.beforeAfterSplit.addEventListener("input", (e) => { state.beforeAfter.split = Number.parseInt(e.target.value, 10); requestRender(); });

  setupCategoryFilter();
  renderTemplateSelect();
  rotateTrending();
  setInterval(rotateTrending, 15000);
  setupStickers();
  renderSuggestions();
  renderHistory();
  hydrateLayerControls();
  baseCacheCanvas.width = canvas.width;
  baseCacheCanvas.height = canvas.height;
  requestAnimationFrame(render);
})();
