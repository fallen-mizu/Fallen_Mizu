import ytSearch from 'yt-search';

export default async function handler(req, res) {
    // 🔥 LOGIKA BARU: JALUR BYPASS PROXY VIDEO LANGSUNG DARI SEARCH.JS VERCEL
if (req.query.stream === "true" || req.query.format) {
  const videoId = req.query.id;
  const targetFormat = req.query.format || "360";

  if (!videoId) {
    return res.status(400).json({ error: "Missing video 'id' parameter" });
  }

  try {
    // 1. Rakit URL YouTube standar resmi yang lolos sensor API Zenzxz
    const realYoutubeUrl = "https://www.youtube.com/watch?v=" + videoId.trim();
    const zenzxzApiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(realYoutubeUrl)}&format=${targetFormat}`;

    // 2. Ambil data link download ticket via IP Bersih Vercel
    const apiResponse = await fetch(zenzxzApiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!apiResponse.ok) throw new Error("Zenzxz API Http Error");
    const data = await apiResponse.json();

    let downloadUrl =
        data?.result?.download ||
        data?.result?.url ||
        data?.downloadUrl ||
        data?.url ||
        data?.result?.video;

    if (!downloadUrl) throw new Error("Link biner tidak ditemukan dalam payload API.");

    // 3. Ambil biner video asli dari server source
    const videoStreamResponse = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ...(req.headers.range ? { "Range": req.headers.range } : {}) // Teruskan range byte video
      }
    });

    // 4. Salurkan balik biner stream video secara langsung (Pass-Through) ke browser client
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    if (videoStreamResponse.headers.get("content-length")) {
      res.setHeader("Content-Length", videoStreamResponse.headers.get("content-length"));
    }
    if (videoStreamResponse.headers.get("content-range")) {
      res.setHeader("Content-Range", videoStreamResponse.headers.get("content-range"));
    }
    if (videoStreamResponse.headers.get("accept-ranges")) {
      res.setHeader("Accept-Ranges", videoStreamResponse.headers.get("accept-ranges"));
    }

    // Ubah biner dari response fetch menjadi buffer lalu kirim langsung
    const videoBuffer = await videoStreamResponse.arrayBuffer();
    return res.status(videoStreamResponse.status).send(Buffer.from(videoBuffer));

  } catch (proxyError) {
    console.error("Vercel Multimedia Proxy Error:", proxyError);
    return res.status(500).json({ error: proxyError.message });
  }
}

// ... (Sisa kode pencarian/search asli milikmu di bawahnya biarkan tetap ada seperti semula)
    
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
    
