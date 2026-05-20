import ytSearch from 'yt-search';
import { Readable } from 'stream';

export default async function handler(req, res) {
    // 🔥 ULTIMATE CORS BYPASS STREAM PROXY
    if (req.query.stream === "true" || req.query.id) {
        const videoId = req.query.id;
        const targetFormat = req.query.format || "360";

        if (!videoId) {
            return res.status(400).json({ error: "Missing video 'id' parameter" });
        }

        try {
            const cleanId = videoId.trim();
            const cleanFormat = targetFormat.toString().trim();
            
            // Rakit URL bayangan sesuai standar cURL sukses kamu
            const realYoutubeUrl = `http://googleusercontent.com/youtube.com/${cleanId}`;
            const zenzxzApiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(realYoutubeUrl)}&format=${cleanFormat}`;

            console.log("🎬 Fetching Ticket from Zenzxz:", zenzxzApiUrl);

            const apiResponse = await fetch(zenzxzApiUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });

            if (!apiResponse.ok) throw new Error("Zenzxz Endpoint Returns HTTP " + apiResponse.status);
            const data = await apiResponse.json();

            let downloadUrl = data?.result?.download || data?.result?.url || data?.downloadUrl || data?.url || data?.result?.video;

            if (!downloadUrl || data.status === false) {
                return res.status(404).json({ error: "Format resolusi ini tidak tersedia untuk video ini." });
            }

            // ⚡️ KUNCI BYPASS CORS: Tembak ke server Savetube dari sisi server (Vercel Backend)
            const videoStreamResponse = await fetch(downloadUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    ...(req.headers.range ? { "Range": req.headers.range } : {}) // Teruskan pencarian durasi (Scrubbing)
                }
            });

            // Paksa Header CORS agar browser kamu diizinkan membaca biner videonya
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

            // Alirkan data (Piping Stream) secara real-time ke Plyr tanpa disimpan di RAM Vercel
            const nodeReadableStream = Readable.from(videoStreamResponse.body);
            return nodeReadableStream.pipe(res);

        } catch (proxyError) {
            console.error("Vercel Proxy Stream Error:", proxyError);
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
