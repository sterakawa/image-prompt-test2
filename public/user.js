// ===============================
// グローバル変数
// ===============================
let selectedEmotion = "";   // 感情ボタン選択
let currentMode = "A";      // A/Bモード
let personaPromptA = "";    // personaA.txt
let personaPromptB = "";    // personaB.txt
let rulePrompt = "";        // rule.txt

// ===============================
// ページロード時処理
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("user.js 読み込みテスト");

  // --- プロンプト読み込み ---
  try {
    const [aText, bText, ruleText] = await Promise.all([
      fetch("/prompts/personaA.txt").then(res => res.text()),
      fetch("/prompts/personaB.txt").then(res => res.text()),
      fetch("/prompts/rule.txt").then(res => res.text())
    ]);

    personaPromptA = aText.trim();
    personaPromptB = bText.trim();
    rulePrompt = ruleText.trim();

    console.log("ロードされたプロンプト:", { personaPromptA, personaPromptB, rulePrompt });
  } catch (err) {
    console.error("プロンプト読み込み失敗:", err);
  }

  // 感情ボタンのイベント
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

// ===============================
// A/Bモード切替
// ===============================
function switchMode(mode) {
  currentMode = mode;
  document.getElementById("switchA").classList.toggle("active", mode === "A");
  document.getElementById("switchB").classList.toggle("active", mode === "B");

  // コメントが既に生成されていれば、対応するバブルを表示
  if (mode === "A") {
    document.getElementById("resultBubbleA").classList.remove("hidden");
    document.getElementById("resultBubbleB").classList.add("hidden");
  } else {
    document.getElementById("resultBubbleB").classList.remove("hidden");
    document.getElementById("resultBubbleA").classList.add("hidden");
  }
}

// ===============================
// データ送信
// ===============================
async function sendData() {
  const username = document.getElementById("username").value || "匿名";
  const userComment = document.getElementById("userComment").value || "";
  const imageInput = document.getElementById("imageInput");

  if (!imageInput.files[0]) {
    alert("写真をアップロードしてください");
    return;
  }

  // プロンプト未読み込み時はエラー
  if (!personaPromptA && !personaPromptB) {
    alert("人格プロンプトが読み込まれていません。/prompts/ を確認してください。");
    return;
  }

  // --- A/B両方のプロンプト（+固定ルール） ---
  const combinedPromptA = `${personaPromptA}\n${rulePrompt}`;
  const combinedPromptB = `${personaPromptB}\n${rulePrompt}`;

  // 送信用にリサイズ＆Base64化
  const base64Image = await resizeImage(imageInput.files[0], 512);

  // APIリクエストデータ
  const requestData = {
    promptA: combinedPromptA,
    promptB: combinedPromptB,
    userPrompt: userComment,
    image: base64Image,
    temperature: 0.7,
    maxTokens: 200,
    topP: 0.6,
    model: "gpt-4.1-mini"
  };

  console.log("送信データ:", requestData);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    console.log("受信データ:", data);

    // Aバブル更新
    document.querySelector("#resultBubbleA .username").textContent = username;
    document.querySelector("#resultBubbleA .comment").textContent = data.commentA || "応答がありません";

    // Bバブル更新
    document.querySelector("#resultBubbleB .username").textContent = username;
    document.querySelector("#resultBubbleB .comment").textContent = data.commentB || "応答がありません";

    // 現在モードに合わせて表示
    switchMode(currentMode);

  } catch (error) {
    console.error("送信エラー:", error);
    alert(`送信に失敗しました (${error.message})`);
  }
}

// ===============================
// 画像プレビュー（フル解像度）
// ===============================
function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("previewArea").innerHTML = `<img src="${e.target.result}" alt="preview">`;
  };
  reader.readAsDataURL(file);
}

// ===============================
// 画像リサイズ & Base64化
// ===============================
function resizeImage(file, maxSize = 512) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8)); // JPEG圧縮率80%
    };
    reader.readAsDataURL(file);
  });
}
