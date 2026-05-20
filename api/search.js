import ytSearch from 'yt-search';

export default async function handler(req, res) {
    // 🔥 PATH INJECTION REAL URL + STRICT RESOLUTION ALIGNMENT
    if (req.query.stream === "true" || req.query.id) {
        const videoId = req.query.id;
        const targetFormat = req.query.format || "360"; // Tangkap parameter resolusi wajib dari frontend

        if (!videoId) {
            return res.status(400).json({ error: "Missing video 'id' parameter" });
        }

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");

        try {
            const cleanId = videoId.trim();
            const cleanFormat = targetFormat.toString().trim();
            
            // Masukkan link bayangan YouTube resmi
            const realYoutubeUrl = `https://www.youtube.com/watch?v=${cleanId}`;
            
            // 🔥 KRUSIAL: Kirim &format= angka resolusi secara strict sesuai instruksi kamu!
            const zenzxzApiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(realYoutubeUrl)}&format=${cleanFormat}`;

            console.log("🎬 Connecting to Zenzxz with Strict Quality Target:", zenzxzApiUrl);

            const apiResponse = await fetch(zenzxzApiUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });

            if (!apiResponse.ok) throw new Error("Zenzxz Returns HTTP " + apiResponse.status);
            const data = await apiResponse.json();

            // Saring link download langsung dari payload respons sukses
            let realDownloadUrl = data?.result?.download || data?.result?.url || data?.downloadUrl || data?.url || data?.result?.video;

            if (!realDownloadUrl || data.status === false) {
                return res.status(200).json({ status: false, error: data.message || "Resolusi ditolak oleh server API." });
            }

            // Kembalikan objek sukses beserta url download langsungnya ke Plyr
            return res.status(200).json({ status: true, videoUrl: realDownloadUrl });

        } catch (proxyError) {
            console.error("Vercel Quality Proxy Error:", proxyError);
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
