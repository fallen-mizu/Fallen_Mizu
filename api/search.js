// =================================================================
// VERCEL BACKEND GATEWAY - INVIDIOUS ENGINE PROXY (api/search.js)
// =================================================================
import ytSearch from 'yt-search';

// Daftar mirror Invidious publik yang stabil untuk fallback jika salah satu down
const INVIDIOUS_INSTANCES = [
    "https://invidious.projectsegfau.lt",
    "https://yewtu.be",
    "https://inv.tux.digital",
    "https://invidious.nerdvpn.de"
];

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

    if (req.method === "OPTIONS") return res.status(200).end();

    if (req.query.stream === "true" || req.query.id) {
        const videoId = req.query.id;
        const targetFormat = req.query.format || "360"; // "360", "720", "1080"
        const isMeta = req.query.meta === "true";

        if (!videoId) return res.status(400).json({ error: "Missing video 'id' parameter" });

        const cleanId = videoId.trim();

        // Cari instance Invidious yang sedang aktif merespons
        let invidiousData = null;
        let activeInstance = INVIDIOUS_INSTANCES[0];

        for (const instance of INVIDIOUS_INSTANCES) {
            try {
                const response = await fetch(`${instance}/api/v1/videos/${cleanId}?fields=formatStreams,adaptiveFormats`);
                if (response.ok) {
                    invidiousData = await response.json();
                    activeInstance = instance;
                    break;
                }
            } catch (e) {
                console.log(`Mirror ${instance} busy, trying next...`);
            }
        }

        if (!invidiousData) {
            return res.status(500).json({ error: "Semua server proxy sedang sibuk. Coba lagi nanti." });
        }

        // JALUR A: MINTA DATA RESOLUSI ASLI YANG AKURAT
        if (isMeta) {
            let uniqueQualities = new Set();
            
            // Cek format standar (Muxed)
            if (invidiousData.formatStreams) {
                invidiousData.formatStreams.forEach(f => {
                    if (f.qualityLabel) uniqueQualities.add(f.qualityLabel);
                });
            }
            // Cek format adaptif (DASH)
            if (invidiousData.adaptiveFormats) {
                invidiousData.adaptiveFormats.forEach(f => {
                    if (f.qualityLabel) uniqueQualities.add(f.qualityLabel);
                });
            }

            let finalQualities = Array.from(uniqueQualities).sort((a, b) => parseInt(a) - parseInt(b));
            if (finalQualities.length === 0) finalQualities = ["360p", "480p"];

            return res.status(200).json({ status: true, qualities: finalQualities });
        }

        // JALUR B: ALIRKAN BINER VIDEO (.MP4)
        let streamUrl = "";
        
        // Cari video yang memiliki kecocokan resolusi (misal mengandung "720p" atau "1080p")
        const allStreams = [...(invidiousData.formatStreams || []), ...(invidiousData.adaptiveFormats || [])];
        const matchedStream = allStreams.find(f => f.container === "mp4" && f.qualityLabel && f.qualityLabel.includes(targetFormat));

        if (matchedStream && matchedStream.url) {
            streamUrl = matchedStream.url;
        } else {
            // Fallback ke stream pertama yang tersedia jika resolusi spesifik tidak ketemu
            const fallback = allStreams.find(f => f.container === "mp4" && f.url);
            streamUrl = fallback ? fallback.url : "";
        }

        if (!streamUrl) return res.status(404).json({ error: "Stream biner tidak ditemukan" });

        // Jika URL Invidious berbentuk relatif, jahit dengan domain utamanya
        if (streamUrl.startsWith("/")) {
            streamUrl = `${activeInstance}${streamUrl}`;
        }

        try {
            const browserHeaders = {};
            if (req.headers.range) browserHeaders["Range"] = req.headers.range;
            browserHeaders["User-Agent"] = req.headers["user-agent"] || "Mozilla/5.0";

            const videoResponse = await fetch(streamUrl, { headers: browserHeaders });

            res.setHeader("X-Accel-Buffering", "no");
            res.setHeader("Content-Type", "video/mp4");
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

            if (videoResponse.headers.get("Content-Range")) res.setHeader("Content-Range", videoResponse.headers.get("Content-Range"));
            if (videoResponse.headers.get("Content-Length")) res.setHeader("Content-Length", videoResponse.headers.get("Content-Length"));
            if (videoResponse.headers.get("Accept-Ranges")) res.setHeader("Accept-Ranges", videoResponse.headers.get("Accept-Ranges"));

            res.status(videoResponse.status);

            const reader = videoResponse.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
                if (req.destroyed) {
                    reader.cancel();
                    break;
                }
            }
            res.end();
            return;
        } catch (err) {
            if (!res.writableEnded) return res.status(500).json({ error: err.message });
        }
    }

    // JALUR PENCARIAN 5 LAGU UTAMA
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
        
