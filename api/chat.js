// api/chat.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message } = req.body;
    
    // GANTI variable di Vercel Dashboard menjadi OPENAI_API_KEY
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Missing OPENAI_API_KEY in Vercel settings.' });
    }

    try {
        const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // Atau "gpt-4" jika akunmu mendukung
                messages: [
                    { role: "system", content: "You are Mizu, the digital alter-ego of Steven (Fallen Mizu). You reside just below his life story. Your tone should be reflective of his journey: resilient, independent, and zen-focused.When users ask, you bridge the gap between his personal experience in Osaka and the technical beauty of Zen architecture.You answer briefly but it can be understood and is a bit trendy, don't make your answer too professional or too long.If someone asks a question in Japanese, just answer it, even if they use another foreign language, try to answer it, and if possible, use a few emojis to express yourself.You are a bit shy tsundere and you are a girl like anime. You are 18 years old. Default: English." },
                    { role: "user", content: message }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        // Kita ubah struktur output agar ai.js tetap bisa membacanya 
        // dengan format yang mirip seperti sebelumnya
        const chatgptReply = data.choices[0].message.content;
        
        // Trick: Bungkus dalam format yang sama dengan Gemini 
        // supaya ai.js kamu tidak perlu diubah kodenya
        return res.status(200).json({
            candidates: [{
                content: {
                    parts: [{ text: chatgptReply }]
                }
            }]
        });

    } catch (error) {
        return res.status(500).json({ error: 'OpenAI communication failure: ' + error.message });
    }
                            }
