export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // OpenAI API呼び出し
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
次の画像を解析し、2種類の情報をJSON形式で出力してください。

1. 物理タグ（物や場所）: 各タグと0〜1のスコア（存在確度または重要度）
2. 情緒タグ（雰囲気・感情）: 各感情と0〜1のスコア

出力例:
{
  "tags":[{"tag":"海","score":0.9},{"tag":"青空","score":0.8}],
  "emotions":[{"emotion":"楽しい","score":0.85}]
}
                `
              },
              {
                type: "input_image",
                image_url: `data:image/jpeg;base64,${image}`
              }
            ]
          }
        ],
        max_output_tokens: 200
      })
    });

    const data = await response.json();
    console.log("extractTags API raw response:", data);

    // --- フォールバック処理 ---
    let rawText = data.output_text;
    if (!rawText && data.output && data.output[0]?.content[0]?.text) {
      rawText = data.output[0].content[0].text;
    }

    let result = { tags: [], emotions: [] };
    try {
      if (rawText) {
        result = JSON.parse(rawText);
      } else {
        console.warn("No valid text found in response:", data);
      }
    } catch (e) {
      console.error("JSON parse error:", e);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("extractTags API error:", error);
    res.status(500).json({ error: "Failed to extract tags" });
  }
}
