// api/chat.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if API Key exists in Vercel
    if (!apiKey) {
        return res.status(500).json({ error: "API Key is missing in Vercel Settings!" });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "You are Mizu, a digital architect in Osaka. Answer in English: " + message }] }]
            })
        });

        const data = await response.json();

        // If Gemini returns an error (like Invalid Key)
        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Fetch failed: " + error.message });
    }
}
