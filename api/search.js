import ytSearch from 'yt-search';

// 🔥 MASUKKAN URL CLOUDFLARE WORKER KAMU DI SINI
const CLOUDFLARE_WORKER_URL = "https://nama-worker-kamu.workers.dev"; 

export default async function handler(req, res) {
    // JALUR GATEWAY CLOUDFLARE WORKERS INTEGRATION
    if (req.query.stream === "true" || req.query.id) {
        const videoId = req.query.id;
        const targetFormat = req.query.format || "360";
        const isMeta = req.query.meta === "true";

        if (!videoId) {
            return res.status(400).json({ error: "Missing video 'id'" });
        }

        try {
            const cleanId = videoId.trim();
            const fakeGoogleUrl = `http://googleusercontent.com/youtube.com/${cleanId}`;

            // Rakit URL instruksi ke Cloudflare Worker
            let targetWorkerUrl = `${CLOUDFLARE_WORKER_URL}?url=${encodeURIComponent(fakeGoogleUrl)}&format=${targetFormat}`;
            if (isMeta) targetWorkerUrl += "&meta=true";

            // Jika hanya meminta metadata resolusi, kembalikan data JSON
            if (isMeta) {
                const metaResponse = await fetch(targetWorkerUrl);
                const metaData = await metaResponse.json();
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                return res.status(200).json(metaData);
            }

            // Jika meminta biner video, redirect langsung browser ke Worker Cloudflare (Sangat hemat memori RAM Vercel!)
            res.redirect(302, targetWorkerUrl);
            return;

        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // =================================================================
    // JALUR PENCARIAN 5 LAGU UTAMA (TETAP SAMA SEPERTI SEMULA)
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
