import ytSearch from 'yt-search';

// GANTI DENGAN URL SUBDOMAIN WORKER CLOUDFLARE KAMU YANG SEBENARNYA
const CLOUDFLARE_WORKER_URL = "https://mizu-api-video.tohsakarin756.workers.dev"; 

export default async function handler(req, res) {
    // GATEWAY TUNNEL INTEGRATION
    if (req.query.stream === "true" || req.query.id) {
        const videoId = req.query.id;
        const targetFormat = req.query.format || "360";
        const isMeta = req.query.meta === "true";

        if (!videoId) {
            return res.status(400).json({ error: "Missing video 'id' parameter" });
        }

        try {
            const cleanId = videoId.trim();
            const mockGoogleUrl = `http://googleusercontent.com/youtube.com/${cleanId}`;

            // Rakit query string menuju Cloudflare Worker secara transparan
            let targetWorkerUrl = `${CLOUDFLARE_WORKER_URL}?url=${encodeURIComponent(mockGoogleUrl)}&format=${targetFormat}`;
            if (isMeta) targetWorkerUrl += "&meta=true";

            if (isMeta) {
                const metaResponse = await fetch(targetWorkerUrl);
                const metaData = await metaResponse.json();
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                return res.status(200).json(metaData);
            }

            // Alihkan (Redirect) Plyr Player langsung ke Cloudflare Worker untuk streaming data biner anti-timeout
            res.redirect(302, targetWorkerUrl);
            return;

        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // =================================================================
    // JALUR LAMA: FITUR PENCARIAN 5 LAGU UTAMA
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
    
