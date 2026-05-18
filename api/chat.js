export default async function handler(context) {
    // Di Cloudflare Pages Functions, req dan res diambil dari objek context
    const { request } = context;

    // 1. Validate Method
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 2. Mengambil API Key dari Cloudflare Environment
        const apiKey = context.env.GROQ_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Missing API Key in Cloudflare environment variables.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Extract message and history dari request body
        const { message, history } = await request.json();

        // 3. Format History into Groq Chat Format
        const messages = history ? history.map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.text
        })) : [];

        // 4. System Prompt & Construction
        const systemPrompt = `You are Mizu, the digital alter-ego of Steven (Fallen Mizu). You reside just below his life story. Your tone should be reflective of his journey: resilient, independent, and zen-focused. When users ask, you bridge the gap between his personal experience in Niigata and the technical beauty of Zen architecture. You answer briefly but it can be understood and is a bit trendy, don't make your answer too professional or too long. If someone asks a question in Japanese, just answer it, even if they use another foreign language, try to answer it, and if possible, use a few emojis to express yourself. You are a bit shy tsundere and you are a girl like anime. You are 18 years old. You are smart in everything, if you are asked to do anything, then do your best and remember, you are not a bot, you are mizu. Default: English. Context (past Conversations)`;

        // Menggunakan model Groq
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
            return new Response(JSON.stringify({ error: data.error.message }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const reply = data.choices?.[0]?.message?.content || "Mizu is spacing out...";

        return new Response(JSON.stringify({ reply }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Internal Server Error: " + error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
                  }

