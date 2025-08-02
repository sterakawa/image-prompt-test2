// ===============================
// グローバル変数
// ===============================
let selectedEmotion = "";   // 感情ボタン選択
let currentMode = "A";      // A/Bモード
let personaPromptA = "";    // 人格Aプロンプト
let personaPromptB = "";    // 人格Bプロンプト
let commentA = "";          // Aコメント
let commentB = "";          // Bコメント

// ===============================
// ページロード時処理
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("user.js 読み込みテスト");

  // 管理画面(localStorage)優先 → 無ければpublicテキスト
  const savedPrompts = JSON.parse(localStorage.getItem("prompts"));
  if (savedPrompts && (savedPrompts.personaPromptA || savedPrompts.personaPromptB)) {
    personaPromptA = savedPrompts.personaPromptA || "";
    personaPromptB = savedPrompts.personaPromptB || "";
    console.log("localStorageからロード:", personaPromptA, personaPromptB);
  } else {
    await loadPromptsFromPublic();
  }

  // 感情ボタンイベント
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
// publicフォルダからプロンプト読み込み
// ===============================
async function loadPromptsFromPublic() {
  try {
    const [aRes, bRes] = await Promise.all([
      fetch("/prompts/personaA.txt"),
      fetch("/prompts/personaB.txt")
    ]);
    personaPromptA = aRes.ok ? await aRes.text() : "";
    personaPromptB = bRes.ok ? await bRes.text() : "";
    console.log("publicからロード:", personaPromptA, personaPromptB);
  } catch (error) {
    console.error("publicプロンプト読み込み失敗:", error);
  }
}

// ===============================
// A/Bモード切替
// ===============================
function switchMode(mode) {
  currentMode = mode;
  document.getElementById("switchA").classList.toggle("active", mode === "A");
  document.getElementById("switchB").classList.toggle("active", mode === "B");

  const bubble = document.getElementById("resultBubble");
  bubble.className = `bubble bubble-${mode.toLowerCase()}`;

  updateBubble();
}

// ===============================
// コメント表示更新
// ===============================
function updateBubble() {
  const username = document.getElementById("username").value || "匿名";
  document.querySelector("#resultBubble .username").textContent = username;
  document.querySelector("#resultBubble .comment").textContent =
    currentMode === "A" ? commentA : commentB;
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

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();

    // コメントをモードごとに保持
    if (currentMode === "A") {
      commentA = data.commentA || data.commentB || "応答がありません";
    } else {
      commentB = data.commentA || data.commentB || "応答がありません";
    }

    updateBubble();
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
