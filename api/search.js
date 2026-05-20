import ytSearch from 'yt-search';
import { Readable } from 'stream'; // Tambahkan dependensi native Node.js di paling atas

export default async function handler(req, res) {
    // 🔥 MULTIMEDIA STREAM PIPING PROXY (SINKRON DENGAN PLYR VIDEO.JS)
    if (req.query.stream === "true" || req.query.url) {
        let incomingUrl = req.query.url;
        const targetFormat = req.query.format || "360";

        if (!incomingUrl && req.query.id) {
            // Fallback aman jika id dikirim mentah
            incomingUrl = "https://youtu.be/1glFz07y27I?si=kSu30Na2eZ5bde3t" + req.query.id.trim();
        }

        if (!incomingUrl) {
            return res.status(400).json({ error: "Missing 'url' or 'id' parameter" });
        }

        try {
            // 1. Ambil tiket download dari API Zenzxz
            let zenzxzApiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(incomingUrl.trim())}&format=${targetFormat.trim()}`;

            let apiResponse = await fetch(zenzxzApiUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });

            if (!apiResponse.ok) throw new Error("Zenzxz API Http Error");
            let data = await apiResponse.json();

            // Auto-fallback jika terdeteksi bug typo ${selectedRes} di server API
            if (data.status === false || data.message?.includes("selectedRes")) {
                const fallbackApiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(incomingUrl.trim())}&format=mp4`;
                const retryResponse = await fetch(fallbackApiUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    }
                });
                if (retryResponse.ok) data = await retryResponse.json();
            }

            let downloadUrl = data?.result?.download || data?.result?.url || data?.downloadUrl || data?.url || data?.result?.video;

            if (!downloadUrl) {
                throw new Error("Link biner tidak ditemukan dari API.");
            }

            // 2. Ambil biner asli dari server source menggunakan metode Stream
            const videoStreamResponse = await fetch(downloadUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    ...(req.headers.range ? { "Range": req.headers.range } : {}) // Teruskan range byte dari Plyr
                }
            });

            // 3. Pasang Header HTTP Passthrough lengkap agar Plyr bisa membaca durasi
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

            // 🔥 FIX UTAMA: Menggunakan Readable.from Web Stream agar data dialirkan langsung (piping)
            // Ini memotong habis penggunaan memori ArrayBuffer yang bikin Vercel overload/lag hitam!
            const nodeReadableStream = Readable.from(videoStreamResponse.body);
            return nodeReadableStream.pipe(res);

        } catch (proxyError) {
            console.error("Vercel Multimedia Proxy Stream Error:", proxyError);
            // Jangan kirim response JSON jika header video terlanjur dikirim, langsung end koneksi
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
