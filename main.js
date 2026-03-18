const canvas = document.getElementById("memeCanvas");
const ctx = canvas.getContext("2d");

const templateSelect = document.getElementById("templateSelect");
const imageUpload = document.getElementById("imageUpload");
const topTextInput = document.getElementById("topText");
const bottomTextInput = document.getElementById("bottomText");
const fontSizeRange = document.getElementById("fontSize");
const fontSizeValue = document.getElementById("fontSizeValue");
const textColorInput = document.getElementById("textColor");
const downloadBtn = document.getElementById("downloadBtn");

const builtInTemplates = [
  { label: "Drake Hotline Bling", src: "https://i.imgflip.com/30b1gx.jpg" },
  { label: "Distracted Boyfriend", src: "https://i.imgflip.com/1ur9b0.jpg" },
  { label: "Doge", src: "https://i.imgflip.com/4t0m5.jpg" },
];

let currentImage = new Image();
let currentFontSize = parseInt(fontSizeRange.value, 10) || 40;
let currentTextColor = textColorInput ? textColorInput.value : "#ffffff";

function setSelectLoadingState(text) {
  if (!templateSelect) return;
  templateSelect.innerHTML = "";
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = text;
  templateSelect.appendChild(opt);
}

function addOptGroup(label, templates) {
  const group = document.createElement("optgroup");
  group.label = label;

  for (const tpl of templates) {
    if (!tpl || !tpl.src) continue;
    const opt = document.createElement("option");
    opt.value = tpl.src;
    opt.textContent = tpl.label || tpl.src;
    group.appendChild(opt);
  }

  if (group.children.length > 0) templateSelect.appendChild(group);
}

function populateTemplateSelect({ assetTemplates }) {
  templateSelect.innerHTML = "";

  addOptGroup("Built-in", builtInTemplates);
  if (assetTemplates && assetTemplates.length) {
    addOptGroup("Assets folder", assetTemplates);
  }

  if (!templateSelect.querySelector("option")) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No templates found";
    templateSelect.appendChild(opt);
  }
}

function loadImageFromSrc(src) {
  if (!src) return;
  const img = new Image();

  // Needed for remote templates to keep canvas export working when CORS allows it.
  // Safe to set for local files/relative paths as well.
  img.crossOrigin = "anonymous";

  img.onload = () => {
    currentImage = img;
    fitCanvasToImage(img);
    renderMeme();
  };
  img.onerror = () => {
    renderError(`Failed to load image: ${src}`);
  };
  img.src = src;
}

function renderError(message) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0b0b10";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '600 16px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function loadTemplateFromSelect() {
  const src = templateSelect.value;
  if (!src) return;
  loadImageFromSrc(src);
}

function normalizeTemplateSrc(src) {
  if (typeof src !== "string") return "";
  let s = src.trim();
  if (!s) return "";

  // Normalize Windows paths to URLs.
  s = s.replace(/\\/g, "/");

  // Allow full URLs unchanged.
  if (/^https?:\/\//i.test(s)) return s;

  // Remove leading ./ or /
  s = s.replace(/^\.\//, "").replace(/^\/+/, "");

  // If they already wrote assets/..., keep it. If they wrote assets\..., it's now assets/...
  if (s.toLowerCase().startsWith("assets/")) return s;

  // Otherwise treat it as a filename inside assets/.
  return `assets/${s}`;
}

async function loadAssetTemplates() {
  try {
    const res = await fetch("assets/manifest.json", { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json) ? json : json && Array.isArray(json.templates) ? json.templates : [];

    return list
      .filter((t) => t && typeof t.src === "string")
      .map((t) => ({
        label: typeof t.label === "string" && t.label.trim() ? t.label.trim() : t.src,
        src: normalizeTemplateSrc(t.src),
      }));
  } catch {
    return [];
  }
}

function fitCanvasToImage(img) {
  const maxWidth = 700;
  const ratio = img.width / img.height;
  let width = img.width;
  let height = img.height;

  if (width > maxWidth) {
    width = maxWidth;
    height = Math.round(width / ratio);
  }

  canvas.width = width;
  canvas.height = height;
}

function renderMeme() {
  if (!currentImage) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

  const topText = topTextInput.value.toUpperCase();
  const bottomText = bottomTextInput.value.toUpperCase();

  ctx.fillStyle = currentTextColor || "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = Math.max(3, currentFontSize / 9);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${currentFontSize}px Impact, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

  const centerX = canvas.width / 2;

  if (topText) {
    const y = currentFontSize * 1.1;
    drawTextWithStroke(topText, centerX, y);
  }

  if (bottomText) {
    const y = canvas.height - currentFontSize * 1.1;
    drawTextWithStroke(bottomText, centerX, y);
  }
}

function drawTextWithStroke(text, x, y) {
  const maxWidth = canvas.width * 0.9;
  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const metrics = ctx.measureText(test);
    if (metrics.width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const totalHeight = lines.length * currentFontSize * 1.05;
  let startY = y - totalHeight / 2 + currentFontSize / 2;

  for (const line of lines) {
    ctx.strokeText(line, x, startY);
    ctx.fillText(line, x, startY);
    startY += currentFontSize * 1.05;
  }
}

templateSelect.addEventListener("change", () => {
  loadTemplateFromSelect();
});

imageUpload.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      fitCanvasToImage(img);
      renderMeme();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);

  // Visually de-select any template when using a custom upload.
  if (templateSelect) templateSelect.value = "";
});

topTextInput.addEventListener("input", () => {
  renderMeme();
});

bottomTextInput.addEventListener("input", () => {
  renderMeme();
});

if (textColorInput) {
  textColorInput.addEventListener("input", () => {
    currentTextColor = textColorInput.value || "#ffffff";
    renderMeme();
  });
}

fontSizeRange.addEventListener("input", () => {
  currentFontSize = parseInt(fontSizeRange.value, 10) || 40;
  fontSizeValue.textContent = `${currentFontSize} px`;
  renderMeme();
});

downloadBtn.addEventListener("click", () => {
  if (!currentImage) return;
  const link = document.createElement("a");
  link.download = "meme.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

window.addEventListener("load", () => {
  fontSizeValue.textContent = `${currentFontSize} px`;

  setSelectLoadingState("Loading templates…");
  loadAssetTemplates().then((assetTemplates) => {
    populateTemplateSelect({ assetTemplates });
    // Load the first available option (built-in by default).
    const firstOption = templateSelect.querySelector("option");
    if (firstOption && firstOption.value) {
      templateSelect.value = firstOption.value;
      loadTemplateFromSelect();
    }
  });
});

