import ytSearch from 'yt-search';

export default async function handler(req, res) {
    // 🔥 PATH INJECTION REAL URL ALIGNMENT (SINKRON DENGAN VIDEO.JS)
    if (req.query.stream === "true" || req.query.id) {
        const videoId = req.query.id;

        if (!videoId) {
            return res.status(400).json({ error: "Missing video 'id' parameter" });
        }

        // Set Header JSON & CORS agar aman diakses frontend
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");

        try {
            const cleanId = videoId.trim();
            
            // 🔥 FIX UTAMA: Kirim URL YouTube Asli / Resmi agar dikenali oleh API Zenzxz
            const realYoutubeUrl = `https://www.youtube.com/watch?v=${cleanId}`;
            
            // Masukkan real URL ke dalam parameter request API Zenzxz
            const zenzxzApiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(realYoutubeUrl)}`;

            console.log("🎬 Connecting to Zenzxz Core with Real URL:", zenzxzApiUrl);

            const apiResponse = await fetch(zenzxzApiUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });

            if (!apiResponse.ok) throw new Error("Zenzxz Returns HTTP " + apiResponse.status);
            const data = await apiResponse.json();

            // Saring link biner mp4 langsung dari properti download/url hasil bypass
            let realDownloadUrl = data?.result?.download || data?.result?.url || data?.downloadUrl || data?.url || data?.result?.video;

            if (!realDownloadUrl) {
                return res.status(200).json({ status: false, error: "Link download tidak ditemukan dalam payload API." });
            }

            // Kembalikan link video mentah (.mp4) dari Savetube secara bersih ke frontend
            return res.status(200).json({ status: true, videoUrl: realDownloadUrl });

        } catch (proxyError) {
            console.error("Vercel Direct Proxy Error:", proxyError);
            return res.status(500).json({ status: false, error: proxyError.message });
        }
    }

    // =================================================================
    // JALUR PENCARIAN 5 LAGU UTAMA (TETAP SAMA)
    // =================================================================
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, message: "Query q diperlukan" });

    try {
        const results = await ytSearch(q);
        const songs = results.videos.slice(0, 5).map(video => ({
            id: video.videoId,
            title: video.title,
            duration: video.timestamp,
            thumbnail: video.thumbnail,
            author: video.author.name
        }));
        
        return res.status(200).json({ status: true, results: songs });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}
    
