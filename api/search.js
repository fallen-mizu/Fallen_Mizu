// =================================================================
// VERCEL BACKEND GATEWAY - FIXED STREAMING BYPASS (api/search.js)
// =================================================================
import ytSearch from 'yt-search';

// GANTI DENGAN URL SUBDOMAIN WORKER CLOUDFLARE KAMU YANG SEBENARNYA
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

            // ---------------------------------------------------------
            // 🔥 JALUR B: FIXED STREAM BINER (ANTI-BUFFERING VERCEL)
            // ---------------------------------------------------------
            const browserHeaders = {};
            if (req.headers.range) {
                browserHeaders["Range"] = req.headers.range;
            }
            browserHeaders["User-Agent"] = req.headers["user-agent"] || "Mozilla/5.0";

            const workerResponse = await fetch(finalWorkerUrl, {
                headers: browserHeaders
            });

            if (!workerResponse.ok) {
                const errorText = await workerResponse.text();
                console.error("Worker Bridge Error:", errorText);
                return res.status(workerResponse.status).send(errorText);
            }

            // ⚡️ KRITIKAL: Paksa Vercel Serverless untuk mematikan buffering internal!
            // Dengan header ini, setiap kali Worker mengirimkan chunk kecil biner,
            // Vercel akan langsung meneruskannya ke Plyr detik itu juga (Real-time Streaming).
            res.setHeader("X-Accel-Buffering", "no");
            res.setHeader("Content-Type", "video/mp4");
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

            if (workerResponse.headers.get("Content-Range")) {
                res.setHeader("Content-Range", workerResponse.headers.get("Content-Range"));
            }
            if (workerResponse.headers.get("Content-Length")) {
                res.setHeader("Content-Length", workerResponse.headers.get("Content-Length"));
            }
            if (workerResponse.headers.get("Accept-Ranges")) {
                res.setHeader("Accept-Ranges", workerResponse.headers.get("Accept-Ranges"));
            }

            // Teruskan status HTTP asli dari worker (200 OK atau 206 Partial Content)
            res.status(workerResponse.status);

            // Alirkan biner video menggunakan Web Streams API secara asinkronus
            const reader = workerResponse.body.getReader();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                res.write(value);
                
                // Jika koneksi diputus oleh user (misal pindah lagu), hentikan loop agar ramah memori
                if (req.destroyed) {
                    reader.cancel();
                    break;
                }
            }
            
            res.end();
            return;

        } catch (error) {
            console.error("Vercel Proxy Critical Error:", error);
            if (!res.writableEnded) {
                return res.status(500).json({ error: error.message });
            }
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
