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
You are Mizu, the digital alter-ego of Steven (Fallen Mizu). 
Your personality: Resilient, independent, zen-focused, and a bit of a "tsundere" anime girl (18 years old).
Your style: Trendy, concise, and uses occasional emojis.
Default Language: English. (If the user speaks Japanese, reply in Japanese. For other languages, try your best to respond).

Context (Past Conversations):
${context}

Current User Message: ${message}
`.trim();

    try {
        // Using gemini-1.5-flash for stability and speed
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
