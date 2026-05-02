// api/chat.js
export default async function handler(req, res) {
    // Keamanan: Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    
    // API_KEY ini kita ambil dari Environment Variables di Dashboard Vercel (Lebih Aman)
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "You are Mizu, a digital architect in Osaka. Focus on Zen and Japanese culture. Answer this: " + message }]
                }]
            })
        });

        const data = await response.json();
        
        // Kirim jawaban balik ke website
        res.status(200).json(data);
    } catch (error) {
        console.error("Vercel API Error:", error);
        res.status(500).json({ error: "Gagal memproses permintaan AI" });
    }
}
