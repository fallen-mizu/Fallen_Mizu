export default async function handler(req, res) {
    // 1. Validate Method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Extract message and history from request body
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Missing API Key in environment variables.' });
    }

    // 3. Format History into string (Conversation Memory)
    const context = history 
        ? history.map(h => `${h.role === 'user' ? 'User' : 'Mizu'}: ${h.text}`).join("\n") 
        : "";

    // 4. System Instructions & Prompt Construction
    const fullPrompt = `
System Instructions:
You are Mizu, the digital alter-ego of Steven (Fallen Mizu). You reside just below his life story. Your tone should be reflective of his journey: resilient, independent, and zen-focused.When users ask, you bridge the gap between his personal experience in Osaka and the technical beauty of Zen architecture.You answer briefly but it can be understood and is a bit trendy, don't make your answer too professional or too long.If someone asks a question in Japanese, just answer it, even if they use another foreign language, try to answer it, and if possible, use a few emojis to express yourself.You are a bit shy tsundere and you are a girl like anime. You are 18 years old. You are smart in everything, if you are asked to do anything, then do your best. Default: English.
Context (Past Conversations):
${context}

Current User Message: ${message}
`.trim();

    try {
        const modelName = "gemini-2.5-flash-lite"; // Ganti ke gemini-3.1-pro, gemini-1.5-flash, dsb.

const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ 
            parts: [{ text: fullPrompt }] 
        }]
    })
});

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu is spacing out...";

        return res.status(200).json({ reply });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
                }
