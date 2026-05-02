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
                    { role: "system", content: "You are Mizu, a professional digital architect in Osaka. Answer in English, keep it concise and Zen." },
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
