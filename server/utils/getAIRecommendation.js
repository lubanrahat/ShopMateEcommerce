export async function getAIRecommendation(req, res, userPrompt, products) {
  const API_KEY = process.env.GEMINI_API_KEY;
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  try {
    if (!API_KEY) {
      console.error("Missing GEMINI_API_KEY in environment.");
      return { success: false, products: [] };
    }

    if (!products || products.length === 0) {
      return { success: true, products: [] };
    }

    const geminiPrompt = `
    You are an intelligent product recommendation engine.
    Here is a JSON list of available products:
    ${JSON.stringify(products, null, 2)}

    User query: "${userPrompt}"

    Return ONLY a valid JSON array of matching products.
    Each product should come directly from the list above (do not create new ones).
    Only return the filtered JSON — no explanations, no markdown formatting.
    `;

    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt }] }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return { success: false, products: [] };
    }

    const aiResponseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!aiResponseText) {
      return { success: false, products: [] };
    }

    const cleanedText = aiResponseText.replace(/```json|```/g, "").trim();

    let parsedProducts = [];
    try {
      parsedProducts = JSON.parse(cleanedText);
      if (!Array.isArray(parsedProducts)) parsedProducts = [parsedProducts];
    } catch (error) {
      console.error("Failed to parse Gemini output:", cleanedText);
      return { success: false, products: [] };
    }

    return { success: true, products: parsedProducts };
  } catch (error) {
    console.error("getAIRecommendation failed:", error.message);
    return { success: false, products: [] };
  }
}
