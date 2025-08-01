export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { promptA, userPrompt, image, temperature, maxTokens, topP, model } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API Key is not set" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content: [
              { type: "text", text: promptA },
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        temperature,
        max_output_tokens: maxTokens,
        top_p: topP
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();

    res.status(200).json({
      commentA: data.output_text || "No comment A",
      commentB: data.output_text || "No comment B",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
