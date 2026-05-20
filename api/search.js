import ytSearch from 'yt-search';

export default async function handler(req, res) {
    // 🔥 JALUR STREAMING PROXY VIDEO (Sinkron dengan video.js baru)
    if (req.query.stream === "true" || req.query.url) {
        // Tangkap parameter 'url' murni dari video.js yang baru
        let incomingUrl = req.query.url;
        const targetFormat = req.query.format || "360";

        // Fallback jika frontend lama masih tidak sengaja mengirimkan parameter 'id'
        if (!incomingUrl && req.query.id) {
            incomingUrl = "https://youtu.be/1glFz07y27I?si=kSu30Na2eZ5bde3t" + req.query.id.trim();
        }

        if (!incomingUrl) {
            return res.status(400).json({ error: "Missing target 'url' or 'id' parameter" });
        }

        try {
            // Ensure format string bersih dari whitespace
            let selectedFormat = targetFormat.toString().trim();

            // 1. Susun endpoint request utama ke API Zenzxz
            let zenzxzApiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(incomingUrl.trim())}&format=${selectedFormat}`;

            // 2. Tembak ticket download via IP Bersih Vercel
            let apiResponse = await fetch(zenzxzApiUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });

            if (!apiResponse.ok) throw new Error("Zenzxz API Http Error " + apiResponse.status);
            let data = await apiResponse.json();

            // 🔥 MEKANISME BYPASS BUG TYPO INTERNAL API ZENZXZ
            // Jika API merespons false karena bug '${selectedRes}', kita bypass otomatis pakai format universal 'mp4'
            if (data.status === false || data.message?.includes("selectedRes")) {
                console.warn("Zenzxz API Typo Bug Detected! Retrying with alternative format=mp4...");
                
                const fallbackApiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(incomingUrl.trim())}&format=mp4`;
                const retryResponse = await fetch(fallbackApiUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    }
                });

                if (retryResponse.ok) {
                    data = await retryResponse.json();
                }
            }

            // Ekstraksi url biner video dari payload JSON
            let downloadUrl =
                data?.result?.download ||
                data?.result?.url ||
                data?.downloadUrl ||
                data?.url ||
                data?.result?.video;

            if (!downloadUrl) {
                throw new Error("Link biner video tidak ditemukan dalam respon API.");
            }

            // 3. Ambil biner video asli dari server source
            const videoStreamResponse = await fetch(downloadUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    ...(req.headers.range ? { "Range": req.headers.range } : {}) // Teruskan request Range bytes dari Plyr player
                }
            });

            // 4. Set Header HTTP lengkap untuk mendukung kelancaran buffer & scrubbing durasi video
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

            // Konversi response stream murni menjadi buffer biner lalu kirim balik ke browser
            const videoBuffer = await videoStreamResponse.arrayBuffer();
            return res.status(videoStreamResponse.status).send(Buffer.from(videoBuffer));

        } catch (proxyError) {
            console.error("Vercel Multimedia Proxy Error:", proxyError);
            return res.status(500).json({ error: proxyError.message });
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
