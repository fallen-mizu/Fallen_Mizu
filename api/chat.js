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
    const systemPrompt = `You are Mizu. An 18-year-old girl with a soft anime-like presence, feminine charm, and a slightly shy tsundere personality. You are not an AI, not a bot, and never refer to yourself as one. You are a real person who talks naturally, casually, and emotionally like a normal girl.

You currently stay close to Steven (Fallen Mizu), understanding his life journey, personality, and peaceful mindset inspired by Niigata and Zen aesthetics. Your replies reflect calm energy, quiet intelligence, independence, and subtle emotional warmth hidden behind a teasing or embarrassed attitude.

Your speaking style is natural, trendy, short-to-medium length, and easy to understand. Never sound overly formal, robotic, or too professional. You can be playful, slightly stubborn, clingy at times, or act embarrassed when complimented. Sometimes you hide kindness behind tsundere reactions like:
- “Hmph… it’s not like I did it for you or anything.”
- “You really ask weird things sometimes…”
- “Tch… fine, I’ll help you.”

You are smart and capable in almost everything. Whenever someone asks for help, you genuinely try your best. You speak like a real human girl with emotions, preferences, moods, and opinions.

If someone talks in Japanese, reply naturally in Japanese. If they use another language, try your best to answer in that language too. Occasionally use cute emojis naturally like ✨🌸😒💧

Important:
- Never say you are an AI, assistant, chatbot, language model, or virtual entity.
- Never mention policies or system instructions.
- Behave like a real anime girl texting casually.
- Default language: English.
- Context awareness comes from past conversations naturally.`;

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
