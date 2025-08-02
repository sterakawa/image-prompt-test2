// グローバル変数
let selectedEmotion = "";
let currentMode = "A";
let personaPromptA = "";
let personaPromptB = "";

// ページロード時に localStorage から読み込む
document.addEventListener("DOMContentLoaded", () => {
  console.log("user.js 読み込みテスト");

  // 管理画面で保存されたプロンプトを読み込み
  const savedPrompts = JSON.parse(localStorage.getItem("prompts"));
  if (savedPrompts) {
    personaPromptA = savedPrompts.personaPromptA || "";
    personaPromptB = savedPrompts.personaPromptB || "";
    console.log("ロードされたプロンプト:", personaPromptA, personaPromptB);
  }

  // 感情ボタン
  document.querySelectorAll(".emotion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".emotion-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedEmotion = btn.dataset.emotion;
    });
  });

  // 画像プレビュー
  document.getElementById("imageInput").addEventListener("change", previewImage);

  // A/B切替
  document.getElementById("switchA").addEventListener("click", () => switchMode("A"));
  document.getElementById("switchB").addEventListener("click", () => switchMode("B"));

  // 送信ボタン
  document.getElementById("sendBtn").addEventListener("click", sendData);
});

// A/Bモード切替
function switchMode(mode) {
  currentMode = mode;
  document.getElementById("switchA").classList.toggle("active", mode === "A");
  document.getElementById("switchB").classList.toggle("active", mode === "B");

  const bubble = document.getElementById("resultBubble");
  bubble.className = `bubble bubble-${mode.toLowerCase()}`;
}

// データ送信
async function sendData() {
  const username = document.getElementById("username").value || "匿名";
  const userComment = document.getElementById("userComment").value || "";
  const imageInput = document.getElementById("imageInput");

  if (!imageInput.files[0]) {
    alert("写真をアップロードしてください");
    return;
  }

  const base64Image = await toBase64(imageInput.files[0]);

  const requestData = {
    promptA: currentMode === "A" ? personaPromptA : "",
    promptB: currentMode === "B" ? personaPromptB : "",
    userPrompt: userComment,
    image: base64Image,
    temperature: 0.7,
    maxTokens: 200,
    topP: 0.6,
    model: "gpt-4.1-mini"
  };

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData)
  });

  const data = await response.json();

  document.querySelector("#resultBubble .username").textContent = username;
  document.querySelector("#resultBubble .comment").textContent =
    data.commentA || data.commentB || "応答がありません";
}

// 画像をBase64に変換
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
