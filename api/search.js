// =================================================================
// VERCEL BACKEND GATEWAY - DIRECT MP4 EXTRACTOR (api/search.js)
// =================================================================
import ytSearch from 'yt-search';

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    // JALUR PROXY DIRECT MP4
    if (req.query.stream === "true" || req.query.id) {
        const videoId = req.query.id;
        if (!videoId) return res.status(400).json({ error: "Missing id" });

        try {
            // Tembak API Cobalt publik yang andal memecah biner mp4
            const cobaltResponse = await fetch("https://api.cobalt.tools/api/json", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    url: `https://www.youtube.com/watch?v=${videoId.trim()}`,
                    videoQuality: "720", // Mengunci kualitas stabil HD agar browser mobile tidak berat
                    downloadMode: "video"
                })
            });

            const data = await cobaltResponse.json();

            if (data.status === "stream" || data.url) {
                return res.status(200).json({ status: true, url: data.url });
            } else {
                return res.status(500).json({ error: "Gagal mengambil stream biner." });
            }
        } catch (err) {
            return res.status(500).json({ error: err.message });
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
