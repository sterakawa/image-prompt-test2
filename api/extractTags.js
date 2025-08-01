export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // DataURL or Base64 の場合どちらでも処理できるように
    const imageData = image.startsWith("data:image")
      ? image
      : `data:image/jpeg;base64,${image}`;

    // OpenAI API 呼び出し
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini", // タグ抽出は軽量モデルで十分
        temperature: 0,
        top_p: 1,
        max_output_tokens: 200,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `以下の画像から、主要な「タグ」と「感情」をJSONで抽出してください。
                出力形式は必ずこの形式で：
                {
                  "tags": [{"tag":"タグ名","score":0.9}],
                  "emotions": [{"emotion":"感情","score":0.8}]
                }`
              },
              {
                type: "input_image",
                image_url: imageData
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error (extractTags):", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log("extractTags API response:", JSON.stringify(data, null, 2));

    // 出力解析
    let tags = [];
    let emotions = [];

    try {
      // output_text → JSONパース
      const parsed = JSON.parse(data.output_text || "{}");
      tags = parsed.tags || [];
      emotions = parsed.emotions || [];
    } catch (e) {
      console.error("Failed to parse tags JSON:", e);
    }

    return res.status(200).json({ tags, emotions });

  } catch (error) {
    console.error("extractTags handler error:", error);
    return res.status(500).json({ error: error.message });
  }
}
