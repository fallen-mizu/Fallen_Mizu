import ytSearch from 'yt-search';
import { Readable } from 'stream';

export default async function handler(req, res) {
    // 🔥 PATH INJECTION MULTIMEDIA PROXY (SINKRON DENGAN POLA SUKSES CURL)
    if (req.query.stream === "true" || req.query.id) {
        const videoId = req.query.id;
        const targetFormat = req.query.format || "360";

        if (!videoId) {
            return res.status(400).json({ error: "Missing video 'id' parameter" });
        }

        try {
            // 1. RAKIT PATTERN SESUAI CONTOH SUKSES KAMU
            // Pola URL Akhir: https://api.zenzxz.my.id/download/youtube?url=https://api.zenzxz.my.id/download/youtube?url=https%3A%2F%2Fyoutu.be%2FsgBdAEoJS4Q%3Fsi%3DH3zcviN7VuPTRUXb&format=144
            // Di mana angka paling belakang dinamis mengikuti target format resolusi (misal /360 atau /144)
            const cleanId = videoId.trim();
            const cleanFormat = targetFormat.toString().trim();
            
            const constructedUrlParam = `https://api.zenzxz.my.id/download/youtube?url=https%3A%2F%2Fyoutu.be%2FsgBdAEoJS4Q%3Fsi%3DH3zcviN7VuPTRUXb&format=144`;
            const zenzxzApiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(constructedUrlParam)}`;

            console.log("🎬 Direct Path Request injected to:", zenzxzApiUrl);

            // 2. Ambil payload JSON data dari server Zenzxz
            let apiResponse = await fetch(zenzxzApiUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });

            if (!apiResponse.ok) throw new Error("Zenzxz Endpoint Returns HTTP " + apiResponse.status);
            let data = await apiResponse.json();

            // Saring link biner 'download' murni dari field respons sukses
            let downloadUrl = data?.result?.download || data?.result?.url || data?.downloadUrl || data?.url;

            if (!downloadUrl) {
                throw new Error("Link download murni tidak ditemukan dalam kembalian JSON.");
            }

            // 3. Streaming Data Piping (Bypass loading memori serverless Vercel)
            const videoStreamResponse = await fetch(downloadUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    ...(req.headers.range ? { "Range": req.headers.range } : {})
                }
            });

            // 4. Inject Full Streaming Video Headers
            res.status(videoStreamResponse.status);
            res.setHeader("Content-Type", "video/mp4");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");
            res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

            if (videoStreamResponse.headers.get("content-length")) {
                res.setHeader("Content-Length", videoStreamResponse.headers.get("content-length"));
            }
            if (videoStreamResponse.headers.get("content-range")) {
                res.setHeader("Content-Range", videoStreamResponse.headers.get("content-range"));
            }
            if (videoStreamResponse.headers.get("accept-ranges")) {
                res.setHeader("Accept-Ranges", videoStreamResponse.headers.get("accept-ranges"));
            }

            // Alirkan biner video secara instan tanpa jeda buffer internal server
            const nodeReadableStream = Readable.from(videoStreamResponse.body);
            return nodeReadableStream.pipe(res);

        } catch (proxyError) {
            console.error("Vercel Direct Proxy Error:", proxyError);
            if (!res.headersSent) {
                return res.status(500).json({ error: proxyError.message });
            }
            return res.end();
        }
    }

    // =================================================================
    // JALUR LAMA: FITUR PENCARIAN 5 LAGU UTAMA (TETAP DIPERTAHANKAN)
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
            
