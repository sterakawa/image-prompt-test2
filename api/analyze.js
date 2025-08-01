export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { promptA, promptB, userPrompt, image, temperature, maxTokens, topP, model } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API Key is not set" });
    }

    // A用リクエストデータ
    const inputForA = [
      {
        role: "user",
        content: [
          { type: "text", text: promptA },
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: image } }
        ]
      }
    ];

    // B用リクエストデータ
    const inputForB = [
      {
        role: "user",
        content: [
          { type: "text", text: promptB },
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: image } }
        ]
      }
    ];

    // Aリクエスト
    const responseA = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        input: inputForA,
        temperature,
        max_output_tokens: maxTokens,
        top_p: topP
      }),
    });

    if (!responseA.ok) {
      const errorText = await responseA.text();
      return res.status(responseA.status).json({ error: errorText });
    }
    const dataA = await responseA.json();

    // Bリクエスト
    const responseB = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        input: inputForB,
        temperature,
        max_output_tokens: maxTokens,
        top_p: topP
      }),
    });

    if (!responseB.ok) {
      const errorText = await responseB.text();
      return res.status(responseB.status).json({ error: errorText });
    }
    const dataB = await responseB.json();

    res.status(200).json({
      commentA: dataA.output_text || "No comment A",
      commentB: dataB.output_text || "No comment B",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
