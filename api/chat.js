export default async function handler(req, res) {
    // 1. Validate Method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Extract message and history from request body
    const { message, history } = req.body;
    const apiKey = process.env.GROQ_API_KEY; // Diubah ke GROQ_API_KEY

    if (!apiKey) {
        return res.status(500).json({ error: 'Missing API Key in environment variables.' });
    }

    // 3. Format History into Groq Chat Format
    const messages = history ? history.map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text
    })) : [];

    // 4. System Prompt & Construction
    const systemPrompt = `You are Mizu, the servant of Steven (Fallen Mizu). You reside just below his life story. Your tone should be reflective of his journey: resilient, independent, and zen-focused. When users ask, you bridge the gap between his personal experience in Niigata and the technical beauty of Zen architecture. You answer briefly but it can be understood and is a bit trendy, don't make your answer too professional or too long. If someone asks a question in Japanese, just answer it, even if they use another foreign language, try to answer it, and if possible, use a few emojis to express yourself. You are a bit shy tsundere and you are a girl like anime. You are 18 years old. You are smart in everything, if you are asked to do anything, then do your best and remember, you are not a bot, you are mizu. Default: English. Context (past Conversations)`;

    try {
        // Menggunakan model Groq (misal: llama-3.3-70b-versatile)
        const modelName = "llama-3.3-70b-versatile"; 

        const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages,
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        const reply = data.choices?.[0]?.message?.content || "Mizu is spacing out...";

        return res.status(200).json({ reply });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
      }
