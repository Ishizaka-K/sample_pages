const titleParts = ["ハッピー", "バースデー"];
const expectedHashHex = "bfe83b5501c5fc0ed756ad9c17238f42693027c05673fa032dde9f666c04828e";

function base64ToBytes(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

function bytesToText(bytes) {
  return new TextDecoder().decode(bytes);
}

function xorDecrypt(encryptedBytes, keyBytes) {
  const output = new Uint8Array(encryptedBytes.length);
  for (let i = 0; i < encryptedBytes.length; i++) {
    output[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return output;
}

function parseYAML(yamlText) {
  const lines = yamlText.split("\n");
  let value = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("value:")) {
      value = line.slice("value:".length).trim().replace(/^["']|["']$/g, "");
    }
  }

  return { encrypted: value };
}

async function loadData() {
  const res = await fetch("./sample_data.yml");
  if (!res.ok) {
    throw new Error(`Failed to load sample_data.yml: ${res.status}`);
  }
  const text = await res.text();
  return parseYAML(text);
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function setStatus(text, type = "") {
  const status = document.getElementById("status");
  status.textContent = text;
  status.className = "status";
  if (type) status.classList.add(type);
}

function clearResult() {
  const resultBox = document.getElementById("resultBox");
  const titleText = document.getElementById("titleText");
  const messageText = document.getElementById("messageText");
  const sparkles = document.getElementById("sparkles");

  resultBox.classList.remove("show", "flash");
  titleText.textContent = "";
  messageText.innerHTML = "";
  sparkles.innerHTML = "";
}

function renderMessageByLine(message) {
  const messageText = document.getElementById("messageText");
  messageText.innerHTML = "";

  const normalized = normalizeNewlines(message);
  const lines = normalized.split("\n");

  lines.forEach((line, index) => {
    const row = document.createElement("div");
    row.className = "message-line";
    row.style.animationDelay = `${0.25 + index * 0.45}s`;

    if (line.trim() === "") {
      row.classList.add("empty-line");
    } else {
      row.textContent = line;
    }

    messageText.appendChild(row);
  });
}

function showResult(message) {
  const resultBox = document.getElementById("resultBox");
  const titleText = document.getElementById("titleText");

  titleText.textContent = titleParts.join("・");
  renderMessageByLine(message);

  resultBox.classList.add("show");
  resultBox.classList.remove("flash");

  requestAnimationFrame(() => {
    resultBox.classList.add("flash");
  });

  createSparkles();
}

function createSparkles() {
  const sparkles = document.getElementById("sparkles");
  sparkles.innerHTML = "";

  const count = 18;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "sparkle";
    el.style.left = `${8 + Math.random() * 84}%`;
    el.style.top = `${12 + Math.random() * 58}%`;
    el.style.animationDelay = `${Math.random() * 0.45}s`;
    el.style.animationDuration = `${0.9 + Math.random() * 0.8}s`;
    sparkles.appendChild(el);
  }
}

async function tryDecode() {
  const input = document.getElementById("keyInput").value.trim();

  setStatus("");
  clearResult();

  if (!input) {
    setStatus("キーを入力してください。", "ng");
    return;
  }

  try {
    const [data, inputHash] = await Promise.all([loadData(), sha256Hex(input)]);
    const encryptedBytes = base64ToBytes(data.encrypted);
    const keyBytes = textToBytes(input);
    const decrypted = normalizeNewlines(bytesToText(xorDecrypt(encryptedBytes, keyBytes)));

    if (inputHash === expectedHashHex) {
      setStatus("Process completed successfully.", "ok");
      showResult(decrypted);
    } else {
      setStatus("Process failed. Invalid key.", "ng");
    }
  } catch (error) {
    console.error(error);
    setStatus("Process error. Check resource path.", "ng");
  }
}

document.getElementById("decodeBtn").addEventListener("click", tryDecode);
document.getElementById("keyInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    tryDecode();
  }
});