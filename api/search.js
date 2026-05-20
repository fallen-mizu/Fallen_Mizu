// =================================================================
// VERCEL BACKEND GATEWAY - DIRECT MULTIMEDIA ENGINE (api/search.js)
// =================================================================
import ytSearch from 'yt-search';
import ytdl from 'ytdl-core';

export default async function handler(req, res) {
    // Inject CORS Header secara mutlak agar Plyr di frontend bisa membaca data
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // ---------------------------------------------------------
    // JALUR NATIVE STREAMING & METADATA ACCURATE DIAGNOSTIC
    // ---------------------------------------------------------
    if (req.query.stream === "true" || req.query.id) {
        const videoId = req.query.id;
        const targetFormat = req.query.format || "360"; // Contoh: "360", "720", "1080"
        const isMeta = req.query.meta === "true";

        if (!videoId) {
            return res.status(400).json({ error: "Missing video 'id' parameter" });
        }

        try {
            const cleanId = videoId.trim();
            const realYoutubeUrl = `https://www.youtube.com/watch?v=${cleanId}`;

            // Ambil informasi manifes resmi langsung dari server internal YouTube
            const videoInfo = await ytdl.getInfo(realYoutubeUrl, {
                requestOptions: {
                    headers: {
                        // Gunakan User-Agent perangkat seluler umum untuk meminimalisir pembatasan cipher
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
                    }
                }
            });

            // JALUR A: AMBIL DATA RESOLUSI ASLI (100% AKURAT, TIDAK HARDCODE)
            if (isMeta) {
                let uniqueQualities = new Set();

                // Deteksi track video MP4 yang valid di dalam manifes YouTube
                videoInfo.formats.forEach(fmt => {
                    if (fmt.container === 'mp4' && fmt.qualityLabel) {
                        uniqueQualities.add(fmt.qualityLabel);
                    }
                });

                let finalQualities = Array.from(uniqueQualities).sort((a, b) => parseInt(a) - parseInt(b));
                
                // Jika video lama tidak mendeteksi format mp4 modern, berikan cadangan logis
                if (finalQualities.length === 0) finalQualities = ["360p", "480p"];

                return res.status(200).json({ status: true, qualities: finalQualities });
            }

            // JALUR B: STREAM BINER VIDEO PASSTHROUGH (ANTI-BLANK SCREEN)
            // Pilih format video mp4 yang paling mendekati atau cocok dengan pilihan user
            let formatOptions = ytdl.chooseFormat(videoInfo.formats, {
                quality: 'highestvideo',
                filter: format => format.container === 'mp4' && format.qualityLabel && format.qualityLabel.includes(targetFormat)
            });

            // Jika format spesifik tidak ditemukan (misal user memaksa bypass), ambil format video mp4 tertinggi yang tersedia
            if (!formatOptions) {
                formatOptions = ytdl.chooseFormat(videoInfo.formats, {
                    quality: 'highest',
                    filter: 'audioandvideo'
                });
            }

            // Matikan sistem buffering Vercel Serverless Function agar video langsung mengalir instan
            res.setHeader("X-Accel-Buffering", "no");
            res.setHeader("Content-Type", "video/mp4");
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

            // Teruskan parameter Range dari Plyr untuk mendukung fitur seek/scrubbing durasi video
            const downloadOptions = { format: formatOptions };
            if (req.headers.range) {
                downloadOptions.range = req.headers.range;
                res.setHeader("Accept-Ranges", "bytes");
            }

            // Inisialisasi pipa aliran biner (Readable Stream) langsung dari server YouTube
            const videoStream = ytdl.downloadFromInfo(videoInfo, downloadOptions);

            videoStream.on('response', (youtubeResponse) => {
                // Teruskan header parsial konten dari YouTube ke browser pengunjung
                if (youtubeResponse.headers['content-range']) {
                    res.setHeader("Content-Range", youtubeResponse.headers['content-range']);
                }
                if (youtubeResponse.headers['content-length']) {
                    res.setHeader("Content-Length", youtubeResponse.headers['content-length']);
                }
                res.status(youtubeResponse.statusCode || 200);
            });

            // Hubungkan aliran data langsung ke objek respons Vercel
            videoStream.pipe(res);

            // Jaga penggunaan memori serverless jika koneksi diputus oleh pengunjung di tengah jalan
            req.on('close', () => {
                videoStream.destroy();
            });

            return;

        } catch (error) {
            console.error("Vercel YTDL Engine Critical Error:", error);
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
                                                                      
