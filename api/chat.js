// api/chat.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "You are Mizu, a digital architect. Answer this: " + message }] }]
            })
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
}
  
