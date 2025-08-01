// ===============================
// グローバル変数
// ===============================
let selectedEmotion = ""; // 感情ボタンで選択された絵文字

// ===============================
// DOMロード後の初期設定
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // 感情ボタンのクリックイベント
  document.querySelectorAll(".emotion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".emotion-btn").forEach((b) =>
        b.classList.remove("selected")
      );
      btn.classList.add("selected");
      selectedEmotion = btn.dataset.emotion;
    });
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
});

// ===============================
// 入力データをまとめて送信する関数
// ===============================
async function sendData() {
  console.log("sendData called"); // デバッグ確認

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

  // パラメータ（数値系）
  const temperature = parseFloat(document.getElementById("temperature").value) || 0.7;
  const maxTokens = parseInt(document.getElementById("maxTokens").value) || 200;
  const topP = parseFloat(document.getElementById("topP").value) || 1.0;
  const model = document.getElementById("model").value;

  // 画像のBase64変換（リサイズ付き）
  if (!imageInput.files[0]) {
    alert("画像を選択してください");
    return;
  }
  const base64Image = await toBase64(imageInput.files[0]);

  // APIリクエスト
  try {
    document.getElementById("loading").style.display = "block";

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promptA: fixedPromptA,
        promptB: fixedPromptB,
        userPrompt,
        image: base64Image,
        temperature,
        maxTokens,
        topP,
        model
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`APIエラー: ${text}`);
    }

    const data = await response.json();
    console.log("API応答:", data);

    // 結果表示
    document.getElementById("resultA").textContent =
      data.commentA || "応答がありません";
    document.getElementById("resultB").textContent =
      data.commentB || "応答がありません";
  } catch (error) {
    console.error("API呼び出しエラー:", error);
    document.getElementById("resultA").textContent =
      "エラーが発生しました: " + error.message;
    document.getElementById("resultB").textContent = "";
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

// ===============================
// 画像をBase64に変換（リサイズ付き）
// ===============================
async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        const newWidth = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        const newHeight = img.width > MAX_WIDTH ? img.height * scale : img.height;

        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(resizedDataUrl.split(",")[1]);
      };
      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===============================
// リセット
// ===============================
function resetForm() {
  document.getElementById("promptInput").value = "";
  document.getElementById("resultA").textContent = "応答がありません";
  document.getElementById("resultB").textContent = "応答がありません";
}

// ===============================
// LocalStorage 保存＆復元
// ===============================
function savePrompts() {
  localStorage.setItem("personaPromptA", document.getElementById("personaPromptA").value);
  localStorage.setItem("personaPromptB", document.getElementById("personaPromptB").value);
  localStorage.setItem("rulePrompt", document.getElementById("rulePrompt").value);
  localStorage.setItem("username", document.getElementById("username").value);
}

function loadSavedPrompts() {
  const savedPersonaA = localStorage.getItem("personaPromptA");
  const savedPersonaB = localStorage.getItem("personaPromptB");
  const savedRule = localStorage.getItem("rulePrompt");
  const savedUser = localStorage.getItem("username");

  if (savedPersonaA) document.getElementById("personaPromptA").value = savedPersonaA;
  if (savedPersonaB) document.getElementById("personaPromptB").value = savedPersonaB;
  if (savedRule) document.getElementById("rulePrompt").value = savedRule;
  if (savedUser) document.getElementById("username").value = savedUser;
}
