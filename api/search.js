// =================================================================
// VERCEL BACKEND GATEWAY - PIPED HLS CORE EXTRACTOR (api/search.js)
// =================================================================
import ytSearch from 'yt-search';

// Daftar kluster server Piped resmi yang memiliki rotasi proxy tangguh
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.tokhmi.xyz",
    "https://api.piped.yt",
    "https://pipedapi.adminforge.de"
];

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

    if (req.method === "OPTIONS") return res.status(200).end();

    if (req.query.stream === "true" || req.query.id) {
        const videoId = req.query.id;
        const isHlsRequest = req.query.type === "hls";
        const requestedFormat = req.query.format || "360";

        if (!videoId) return res.status(400).json({ error: "Missing id parameter" });
        const cleanId = videoId.trim();

        // 1. Ambil data manifes komprehensif dari kluster Piped API
        let pipedData = null;
        for (const instance of PIPED_INSTANCES) {
            try {
                const pipedResponse = await fetch(`${instance}/streams/${cleanId}`);
                if (pipedResponse.ok) {
                    pipedData = await pipedResponse.json();
                    break;
                }
            } catch (e) {
                console.log(`Piped instance busy, rotating to next server...`);
            }
        }

        if (!pipedData) {
            return res.status(500).json({ error: "YouTube core gateway timeout. Coba beberapa saat lagi." });
        }

        // JALUR A: STREAMING ADAPTIF UTAMA (HLS / m3u8) -> Mendukung Suara + Video 1080p disatukan otomatis
        if (isHlsRequest && pipedData.hls) {
            try {
                const manifestResponse = await fetch(pipedData.hls);
                const manifestText = await manifestResponse.text();
                
                res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
                res.setHeader("Cache-Control", "no-cache");
                return res.status(200).send(manifestText);
            } catch (err) {
                return res.status(500).send(err.message);
            }
        }

        // JALUR B: FALLBACK SINGLE STREAM (MP4 KUALITAS STANDAR)
        let fallbackUrl = "";
        if (pipedData.videoStreams) {
            // Cari format video murni yang cocok dengan parameter format
            const matchedStream = pipedData.videoStreams.find(s => s.quality === `${requestedFormat}p` || s.quality === requestedFormat);
            fallbackUrl = matchedStream ? matchedStream.url : pipedData.videoStreams[0].url;
        }

        if (!fallbackUrl) return res.status(404).json({ error: "Video stream stream untrunnelled." });

        try {
            const browserHeaders = {};
            if (req.headers.range) browserHeaders["Range"] = req.headers.range;
            browserHeaders["User-Agent"] = req.headers["user-agent"] || "Mozilla/5.0";

            const videoResponse = await fetch(fallbackUrl, { headers: browserHeaders });

            res.setHeader("X-Accel-Buffering", "no");
            res.setHeader("Content-Type", "video/mp4");

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

    // JALUR LAMA: PENCARIAN 5 LAGU UTAMA
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
