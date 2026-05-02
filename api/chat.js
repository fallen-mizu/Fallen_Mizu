export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Missing GEMINI_API_KEY in Vercel settings.' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: "You are Mizu, the digital alter-ego of Steven (Fallen Mizu). You reside just below his life story. Your tone should be reflective of his journey: resilient, independent, and zen-focused.When users ask, you bridge the gap between his personal experience in Osaka and the technical beauty of Zen architecture.You answer briefly but it can be understood and is a bit trendy, don't make your answer too professional or too long.If someone asks a question in Japanese, just answer it, even if they use another foreign language, try to answer it, and if possible, use a few emojis to express yourself.You are a bit shy tsundere and you are a girl like anime. You are 18 years old. Default: English. Question: " + message }] 
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Communication failure: ' + error.message });
    }
}
