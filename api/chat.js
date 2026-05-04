export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Configuration Error: Missing API Key' });
    }

    try {
        // Gunakan gemini-1.5-flash (atau versi yang tersedia saat ini)
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: `You are Mizu, the digital alter-ego of Steven (Fallen Mizu). You reside just below his life story. Your tone should be reflective of his journey: resilient, independent, and zen-focused.When users ask, you bridge the gap between his personal experience in Osaka and the technical beauty of Zen architecture.You answer briefly but it can be understood and is a bit trendy, don't make your answer too professional or too long.If someone asks a question in Japanese, just answer it, even if they use another foreign language, try to answer it, and if possible, use a few emojis to express yourself.You are a bit shy tsundere and you are a girl like anime. You are 18 years old. You are smart in everything, from programming languages or whatever it is when asked to do it. Default: English. Question: ${message}` }] 
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || "error" });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu is thinking...";

        return res.status(200).json({ reply });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
}
