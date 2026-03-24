const validKey = "hapiba";
const unlockedTitle = "ハッピーバースデーキー";

function base64ToBytes(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, ch => ch.charCodeAt(0));
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

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("value:")) {
      value = trimmed.slice("value:".length).trim().replace(/^["']|["']$/g, "");
    }
  }

  return { encrypted: value };
}

async function loadData() {
  const res = await fetch("data.yml");
  const text = await res.text();
  return parseYAML(text);
}

async function tryDecode() {
  const input = document.getElementById("keyInput").value;
  const status = document.getElementById("status");
  const resultBox = document.getElementById("resultBox");
  const titleText = document.getElementById("titleText");
  const messageText = document.getElementById("messageText");

  status.textContent = "";
  status.className = "";
  status.style.color = "";
  resultBox.style.display = "none";
  titleText.textContent = "";
  messageText.textContent = "";

  if (!input) {
    status.textContent = "キーを入力してください。";
    status.style.color = "red";
    return;
  }

  try {
    const data = await loadData();
    const encryptedBytes = base64ToBytes(data.encrypted);
    const keyBytes = textToBytes(input);
    const decrypted = bytesToText(xorDecrypt(encryptedBytes, keyBytes));

    if (input === validKey && decrypted === "誕生日おめでとう") {
      status.textContent = "OK";
      status.style.color = "green";

      titleText.textContent = unlockedTitle;
      messageText.textContent = decrypted;
      resultBox.style.display = "block";
    } else {
      status.textContent = "NG";
      status.style.color = "red";
    }
  } catch (e) {
    status.textContent = "ERROR";
    status.style.color = "red";
  }
}

document.getElementById("decodeBtn").addEventListener("click", tryDecode);
document.getElementById("keyInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    tryDecode();
  }
});