import ytSearch from 'yt-search';
import { Readable } from 'stream';

export default async function handler(req, res) {
    // 🔥 PERFECT REBUILD: PATH INJECTION STREAM ALIGNMENT
    if (req.query.stream === "true" || req.query.id) {
        const videoId = req.query.id;

        if (!videoId) {
            return res.status(400).json({ error: "Missing video 'id' parameter" });
        }

        try {
            const cleanId = videoId.trim();
            
            // 🔥 KUNCI UTAMA: Kita rakit URL bayangan persis seperti contoh curl suksesmu.
            // ID Video diletakkan langsung di paling belakang menggantikan angka mock!
            const constructedUrlParam = `http://googleusercontent.com/youtube.com/${cleanId}`;
            
            // Tembak ke API Zenzxz HANYA membawa parameter url bersih tanpa append format angka yang bikin eror typo
            const zenzxzApiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(constructedUrlParam)}`;

            console.log("🎬 Connecting to Zenzxz Core Injector:", zenzxzApiUrl);

            let apiResponse = await fetch(zenzxzApiUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });

            if (!apiResponse.ok) throw new Error("Zenzxz Returns HTTP " + apiResponse.status);
            const data = await apiResponse.json();

            // Ambil link biner mp4 langsung dari properti download/url hasil bypass
            let downloadUrl = data?.result?.download || data?.result?.url || data?.downloadUrl || data?.url || data?.result?.video;

            if (!downloadUrl) {
                throw new Error("API Zenzxz tidak mengembalikan link biner (.mp4) yang valid.");
            }

            // Ambil data biner stream dari resource destination
            const videoStreamResponse = await fetch(downloadUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    ...(req.headers.range ? { "Range": req.headers.range } : {})
                }
            });

            // Set Passthrough Headers untuk kelancaran Buffer Plyr Engine
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

            // Alirkan data video secara langsung (piping) tanpa memakan memori RAM serverless Vercel
            const nodeReadableStream = Readable.from(videoStreamResponse.body);
            return nodeReadableStream.pipe(res);

        } catch (proxyError) {
            console.error("Vercel Proxy Critical Error:", proxyError);
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
