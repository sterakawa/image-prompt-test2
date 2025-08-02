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

  const bubble = document.getElementById("resultBubble");
  bubble.className = `bubble bubble-${mode.toLowerCase()}`;
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

  // --- モードごとにプロンプト決定（+固定ルール） ---
  const combinedPromptA = `${personaPromptA}\n${rulePrompt}`;
  const combinedPromptB = `${personaPromptB}\n${rulePrompt}`;

  // Base64変換
  const base64Image = await toBase64(imageInput.files[0]);

  // APIリクエストデータ
  const requestData = {
    promptA: currentMode === "A" ? combinedPromptA : "",
    promptB: currentMode === "B" ? combinedPromptB : "",
    userPrompt: userComment,
    image: base64Image,
    temperature: 0.7,
    maxTokens: 200,
    topP: 0.6,
    model: "gpt-4.1-mini"
  };

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();

    // 結果表示
    document.querySelector("#resultBubble .username").textContent = username;
    document.querySelector("#resultBubble .comment").textContent =
      data.commentA || data.commentB || "応答がありません";

    // 初回は非表示だったバブルを表示
    document.getElementById("resultBubble").style.display = "inline-block";

  } catch (error) {
    console.error("送信エラー:", error);
    alert("送信に失敗しました。もう一度お試しください。");
  }
}

// ===============================
// 画像プレビュー
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
// 画像をBase64に変換
// ===============================
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
