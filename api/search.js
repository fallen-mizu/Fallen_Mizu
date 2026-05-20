// =================================================================
// VERCEL BACKEND GATEWAY - FIXED REVERSE PROXY (api/search.js)
// =================================================================
import ytSearch from 'yt-search';

// ⚠️ PASTIKAN URL WORKER CLOUDFLARE KAMU SUDAH BENAR
const CLOUDFLARE_WORKER_URL = "https://mizu-api-video.tohsakarin756.workers.dev"; 

export default async function handler(req, res) {
    // Set standar CORS Header agar Plyr bebas membaca stream byte
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // ---------------------------------------------------------
    // JALUR MULTIMEDIA: HANDSHAKE STREAM & METADATA VIA WORKER
    // ---------------------------------------------------------
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

            // 🔥 PERBAIKAN UTAMA: Gunakan URLSearchParams agar query string 100% aman dari masking/stripping Vercel
            const workerParams = new URLSearchParams();
            workerParams.append("url", mockGoogleUrl);
            workerParams.append("format", targetFormat);
            if (isMeta) {
                workerParams.append("meta", "true");
            }

            const finalWorkerUrl = `${CLOUDFLARE_WORKER_URL}?${workerParams.toString()}`;

            // JALUR A: Minta data resolusi tombol (Meta)
            if (isMeta) {
                const metaResponse = await fetch(finalWorkerUrl);
                const metaData = await metaResponse.json();
                return res.status(200).json(metaData);
            }

            // JALUR B: STREAM BINER (REVERSE PROXY)
            const browserHeaders = {};
            if (req.headers.range) {
                browserHeaders["Range"] = req.headers.range;
            }
            browserHeaders["User-Agent"] = req.headers["user-agent"] || "Mozilla/5.0";

            const workerResponse = await fetch(finalWorkerUrl, {
                headers: browserHeaders
            });

            // Jika Worker mengembalikan status error, teruskan ke log untuk mempermudah debug
            if (!workerResponse.ok) {
                const errorText = await workerResponse.text();
                console.error("Worker Bridge Error:", errorText);
                return res.status(workerResponse.status).send(errorText);
            }

            // Ambil semua header penting terkait content-range (untuk fitur seek/scrubbing video)
            res.setHeader("Content-Type", "video/mp4");
            if (workerResponse.headers.get("Content-Range")) {
                res.setHeader("Content-Range", workerResponse.headers.get("Content-Range"));
            }
            if (workerResponse.headers.get("Content-Length")) {
                res.setHeader("Content-Length", workerResponse.headers.get("Content-Length"));
            }
            if (workerResponse.headers.get("Accept-Ranges")) {
                res.setHeader("Accept-Ranges", workerResponse.headers.get("Accept-Ranges"));
            }

            res.status(workerResponse.status);

            // Alirkan biner video secara langsung (Pipe Stream) dari Worker ke browser
            const reader = workerResponse.body.getReader();
            
            async function pushChunks() {
                const { done, value } = await reader.read();
                if (done) {
                    res.end();
                    return;
                }
                res.write(value);
                await pushChunks();
            }

            await pushChunks();
            return;

        } catch (error) {
            console.error("Vercel Proxy Critical Error:", error);
            return res.status(500).json({ error: error.message });
        }
    }

    // ---------------------------------------------------------
    // JALUR FITUR LAMA: PENCARIAN 5 LAGU UTAMA
    // ---------------------------------------------------------
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
    
