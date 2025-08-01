console.log("main.js 読み込みテスト");

// ===============================
// グローバル変数
// ===============================
let selectedEmotion = ""; // 感情ボタンで選択された絵文字
let lastRequestData = null; // リトライ用に直前リクエスト保持

// ===============================
// DOMロード後の初期設定
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded 発火");

  // 感情ボタンのクリックイベント
  document.querySelectorAll(".emotion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".emotion-btn").forEach((b) =>
        b.classList.remove("selected")
      );
      btn.classList.add("selected");
      selectedEmotion = btn.dataset.emotion;
      console.log("選択された感情:", selectedEmotion);
    });
  });

  // タグ抽出テストボタン
  document.getElementById("extractBtn")?.addEventListener("click", async () => {
    const imageInput = document.getElementById("imageInput");
    if (!imageInput.files[0]) {
      alert("画像を選択してください");
      return;
    }
    const base64Image = await toBase64(imageInput.files[0]);
    await extractTagsAndSave(base64Image);
  });

  // 比較送信ボタン
  document.getElementById("compareBtn").addEventListener("click", sendData);

  // リセットボタン
  document.getElementById("resetBtn").addEventListener("click", resetForm);

  // ページロード時に保存されたプロンプト・名前を復元
  loadSavedPrompts();

  // 入力があればリアルタイム保存
  ["personaPromptA", "personaPromptB", "rulePrompt", "username"].forEach(id => {
    document.getElementById(id).addEventListener("input", savePrompts);
  });

  // 履歴表示
  displayHistory();
});

// ===============================
// 入力データをまとめて送信する関数
// ===============================
async function sendData() {
  console.log("sendData called");

  const personaAEl = document.getElementById("personaPromptA");
  const personaBEl = document.getElementById("personaPromptB");
  const rulePromptEl = document.getElementById("rulePrompt");
  const inputPromptEl = document.getElementById("promptInput");
  const usernameEl = document.getElementById("username");
  const imageInput = document.getElementById("imageInput");

  // 値取得
  const username = usernameEl.value || "匿名";
  const personaA = personaAEl.value;
  const personaB = personaBEl.value;
  const rulePrompt = rulePromptEl.value;
  const userPrompt = inputPromptEl.value;

  // 合成プロンプト
  const fixedPromptA = `${personaA}\n${rulePrompt}\n\n投稿者: ${username}\n感情: ${selectedEmotion}`;
  const fixedPromptB = `${personaB}\n${rulePrompt}\n\n投稿者: ${username}\n感情: ${selectedEmotion}`;

  // パラメータ
  const temperature = parseFloat(document.getElementById("temperature").value) || 0.7;
  const maxTokens = parseInt(document.getElementById("maxTokens").value) || 200;
  const topP = parseFloat(document.getElementById("topP").value) || 1.0;
  const model = document.getElementById("model").value;

  // 画像チェック
  if (!imageInput.files[0]) {
    alert("画像を選択してください");
    return;
  }

  // Base64変換
  const base64Image = await toBase64(imageInput.files[0]);

  // リトライ用データ
  lastRequestData = {
    promptA: fixedPromptA,
    promptB: fixedPromptB,
    userPrompt,
    image: base64Image,
    temperature,
    maxTokens,
    topP,
    model
  };

  console.log("送信データ:", lastRequestData);

  // APIリクエスト
  document.getElementById("loading").style.display = "block";

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lastRequestData)
  });

  const data = await response.json();
  console.log("APIレスポンス:", data);

  // 結果表示
  document.getElementById("resultA").textContent =
    data.commentA || data.output_text || "応答がありません";
  document.getElementById("resultB").textContent =
    data.commentB || data.output_text || "応答がありません";

  document.getElementById("loading").style.display = "none";
}

// ===============================
// 補助関数
// ===============================

// 画像をBase64に変換
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 入力保存
function savePrompts() {
  const prompts = {
    personaPromptA: document.getElementById("personaPromptA").value,
    personaPromptB: document.getElementById("personaPromptB").value,
    rulePrompt: document.getElementById("rulePrompt").value,
    username: document.getElementById("username").value
  };
  localStorage.setItem("prompts", JSON.stringify(prompts));
}

// 入力復元
function loadSavedPrompts() {
  const saved = localStorage.getItem("prompts");
  if (!saved) return;
  const data = JSON.parse(saved);
  document.getElementById("personaPromptA").value = data.personaPromptA || "";
  document.getElementById("personaPromptB").value = data.personaPromptB || "";
  document.getElementById("rulePrompt").value = data.rulePrompt || "";
  document.getElementById("username").value = data.username || "";
}

// 履歴表示（仮）
function displayHistory() {
  const historyEl = document.getElementById("historyResult");
  historyEl.textContent = "履歴はまだ実装されていません";
}

// リセット
function resetForm() {
  document.getElementById("personaPromptA").value = "";
  document.getElementById("personaPromptB").value = "";
  document.getElementById("rulePrompt").value = "";
  document.getElementById("promptInput").value = "";
  document.getElementById("username").value = "";
  document.querySelectorAll(".emotion-btn").forEach((b) =>
    b.classList.remove("selected")
  );
  selectedEmotion = "";
  document.getElementById("resultA").textContent = "結果A: 応答がありません";
  document.getElementById("resultB").textContent = "結果B: 応答がありません";
}
