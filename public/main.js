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
  try {
    document.getElementById("loading").style.display = "block";

    const response = await fetch(`${window.location.origin}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lastRequestData)
    });

    console.log("fetchステータス:", response.status);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`APIエラー: ${text}`);
    }

  const data = await response.json();
console.log("APIからのレスポンス内容:", data); // ← ここに追加

    document.getElementById("resultA").textContent =
  data.commentA || data.output_text || "応答がありません";
document.getElementById("resultB").textContent =
  data.commentB || data.output_text || "応答がありません";

    const errorEl = document.getElementById("errorMessage");
    if (errorEl) errorEl.style.display = "none";

  } catch (error) {
    console.error("API呼び出しエラー:", error);
    document.getElementById("resultA").textContent =
      "エラーが発生しました: " + error.message;
    document.getElementById("resultB").textContent = "";

    const errorEl = document.getElementById("errorMessage");
    if (errorEl) errorEl.style.display = "block";
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}
