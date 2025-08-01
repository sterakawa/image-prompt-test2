import OpenAI from "openai";

// OpenAIクライアントを初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Vercel環境変数で設定
});

export default async function handler(req, res) {
  // POST以外は405エラー
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      promptA,
      promptB,
      userPrompt,
      image,
      temperature,
      maxTokens,
      topP,
      model
    } = req.body;

    // 必須チェック
    if (!promptA || !promptB || !userPrompt || !image) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ========== 共通関数：API呼び出し ==========
    async function generateResponse(promptText) {
      const response = await openai.chat.completions.create({
        model: model || "gpt-4.1-mini", // デフォルトモデル
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `${promptText}\n\n${userPrompt}` },
              { type: "image_url", image_url: image }, // data:image/jpeg;base64,... のまま送信可
            ],
          },
        ],
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 200,
        top_p: topP ?? 1.0,
      });

      // API応答の本文を返す
      return response.choices[0]?.message?.content || "応答なし";
    }

    // ========== 並列でA/B両方生成 ==========
    const [commentA, commentB] = await Promise.all([
      generateResponse(promptA),
      generateResponse(promptB),
    ]);

    // 結果返却
    return res.status(200).json({ commentA, commentB });

  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
