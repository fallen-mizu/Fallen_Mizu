// =================================================================
// MIZU PLAYER - NATIVE YT CLOUDFLARE WORKER INTEGRATION (video.js)
// =================================================================

let mizuPlyrInstance = null;

/**
 * Fungsi utama untuk menginisialisasi container player multimedia Mizu
 * @param {string} videoId - ID Video dari YouTube (bisa mengandung prefix youtube_)
 * @param {string} title - Judul video untuk ditampilkan di UI Player
 */
async function playVideoTrack(videoId, title) {
    const songListContainer = document.getElementById("yt-song-list");
    if (!songListContainer) return;

    // Cari atau buat container video inline di bawah daftar lagu
    let inlineVideoContainer = document.getElementById("mizu-inline-video-container");
    if (!inlineVideoContainer) {
        inlineVideoContainer = document.createElement("div");
        inlineVideoContainer.id = "mizu-inline-video-container";
        inlineVideoContainer.style = "margin-top: 25px; width: 100%; display: flex; flex-direction: column; align-items: center; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 20px;";
        songListContainer.after(inlineVideoContainer);
    }

    const cleanVideoId = videoId.replace("youtube_", "").trim();
    inlineVideoContainer.setAttribute("data-active-id", cleanVideoId);
    inlineVideoContainer.setAttribute("data-active-title", title);

    // Render state loading selagi menganalisis manifest asli YouTube di Cloudflare Workers
    inlineVideoContainer.innerHTML = `
        <div id="video-loader" style="text-align: center; padding: 35px 0; width: 100%; max-width: 450px; background: #fafafa; border-radius: 12px; border: 1px dashed rgba(0,0,0,0.05);">
            <div style="font-weight: bold; font-size: 0.8rem; color: #BC002D; letter-spacing: 0.5px; animation: mizuPulse 1.5s infinite;">🎬 MIZU NATIVE ENGINE v3</div>
            <div style="font-size: 0.7rem; opacity: 0.6; font-style: italic; margin-top: 5px;">Analyzing video stream tracks & FPS sync...</div>
        </div>
        <style>
            @keyframes mizuPulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        </style>
    `;

    try {
        // 1. Lakukan cek ombak (Pre-fetch Meta) untuk menarik resolusi asli bawaan video YouTube tersebut
        const metaResponse = await fetch(`/api/search?id=${encodeURIComponent(cleanVideoId)}&stream=true&meta=true`);
        const metaData = await metaResponse.json();

        // Ambil array resolusi dari worker (Contoh: ["144p", "360p", "720p60", "1080p60"])
        const dynamicQualities = metaData.qualities || ["144p", "240p", "360p", "480p"];

        // Cari resolusi default yang paling stabil untuk pemutaran awal (utamakan 360p jika ada)
        let initialQuality = "360p";
        if (!dynamicQualities.includes("360p")) {
            // Jika tidak ada 360p, ambil indeks tengah atau resolusi pertama yang tersedia
            initialQuality = dynamicQualities.includes("480p") ? "480p" : dynamicQualities[0];
        }

        // 2. Kirim ke fungsi render player utama
        loadInlineResolutionWithQualities(initialQuality, dynamicQualities);

    } catch (e) {
        console.error("Mizu Core Metadata Extractor Failed:", e);
        // Fallback darurat jika manifest YouTube gagal dibedah, sediakan profil standar maksimal 480p
        loadInlineResolutionWithQualities("360p", ["144p", "240p", "360p", "480p"]);
    }
}

/**
 * Fungsi untuk merender ulang antarmuka Plyr berdasarkan kualitas resolusi yang dipilih
 * @param {string} targetQuality - Label kualitas yang dipilih (misal: "1080p60")
 * @param {Array} allowedQualitiesList - Array kumpulan resolusi asli video tersebut
 */
function loadInlineResolutionWithQualities(targetQuality, allowedQualitiesList) {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    if (!inlineContainer) return;

    const videoId = inlineContainer.getAttribute("data-active-id");
    const title = inlineContainer.getAttribute("data-active-title");

    // Amankan posisi durasi detik terakhir dan status play/pause video agar tidak terreset ke awal saat ganti resolusi
    let lastTimestamp = 0;
    let isPlaying = true;
    
    if (mizuPlyrInstance) {
        lastTimestamp = mizuPlyrInstance.currentTime;
        isPlaying = mizuPlyrInstance.playing;
        mizuPlyrInstance.destroy();
        mizuPlyrInstance = null;
    }

    // ⚡️ MEMBERSIHKAN FORMAT: Ubah string seperti "1080p60" menjadi murni angka "1080" untuk query backend Vercel
    const cleanFormatNumber = targetQuality.replace("p", "").replace("60", "").trim();

    // Tembak source langsung ke Vercel API Gateway yang mengarah ke Cloudflare Workers ter-bypass CORS
    const finalVercelProxyUrl = `/api/search?id=${encodeURIComponent(videoId)}&format=${cleanFormatNumber}&stream=true`;

    // 3. Bangun tombol resolusi secara dinamis berdasarkan track asli video YouTube-nya
    let resolutionButtonsHtml = '';
    allowedQualitiesList.forEach(q => {
        // Membungkus parameter array string dengan tanda kutip tunggal agar aman dibaca JavaScript engine onclick
        const escapedListStr = allowedQualitiesList.map(item => `'${item}'`).join(',');
        
        resolutionButtonsHtml += `
            <button class="inline-res-btn" data-res="${q}" onclick="loadInlineResolutionWithQualities('${q}', [${escapedListStr}])">
                ${q}
            </button>
        `;
    });

    inlineContainer.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: bold; color: #333; text-align: center; margin-bottom: 12px; width: 100%; max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px;">
            📺 Playing Video: <span style="font-weight: 500; color: #666;">${title}</span>
        </div>

        <div style="position: relative; width: 100%; max-width: 450px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); background: #000;">
            <video id="mizu-inline-video-element" playsinline controls crossorigin="anonymous">
                <source src="${finalVercelProxyUrl}" type="video/mp4" />
            </video>
            <div onclick="closeInlineVideoPlayer()" style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; font-weight: bold; z-index: 10; user-select: none; -webkit-tap-highlight-color: transparent;">×</div>
        </div>
        
        <div style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;">
            <label style="color: #999; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Mizu Native Track Synchronizer</label>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
                ${resolutionButtonsHtml}
            </div>
            <div id="mizu-codec-error-ui" style="margin-top: 5px;"></div>
        </div>

        <style>
            :root {
                --plyr-color-main: #BC002D;
                --plyr-video-control-background-hover: rgba(188, 0, 45, 0.2);
            }
            .inline-res-btn {
                background: #ffffff; color: #555; border: 1px solid rgba(0,0,0,0.08);
                padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; cursor: pointer; transition: all 0.2s; -webkit-tap-highlight-color: transparent;
            }
            .inline-res-btn:hover { background: #f9f9f9; }
            .inline-res-btn.active-inline-res {
                background: #BC002D !important; color: white !important; border-color: #BC002D !important; box-shadow: 0 2px 6px rgba(188, 0, 45, 0.25);
            }
            .plyr { border-radius: 12px; }
        </style>
    `;

    // 4. Inisialisasi ulang komponen Plyr Core Engine
    mizuPlyrInstance = new Plyr("#mizu-inline-video-element", {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        tooltips: { controls: false, seek: true },
        ratio: '16:9'
    });

    // Jalankan sinkronisasi detitk video dan trigger auto play bypass
    mizuPlyrInstance.on('ready', () => {
        mizuPlyrInstance.currentTime = lastTimestamp;
        if (isPlaying) {
            mizuPlyrInstance.play().catch(e => console.log("Autoplay buffer handler handled:", e));
        }
    });

    // Tandai tombol resolusi mana yang saat ini sedang aktif menyala Crimson
    document.querySelectorAll(".inline-res-btn").forEach(btn => {
        if (btn.getAttribute("data-res") === targetQuality) {
            btn.classList.add("active-inline-res");
        }
    });

    inlineContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Hubungkan detektor error internal HTML5 Video element
    const videoElement = document.getElementById("mizu-inline-video-element");
    if (videoElement) {
        videoElement.onerror = () => {
            const errorUi = document.getElementById("mizu-codec-error-ui");
            if (errorUi) {
                errorUi.innerHTML = `
                    <div style="font-size: 0.65rem; color: #BC002D; font-weight: bold; text-align: center;">
                        ⚠️ Jalur stream ${targetQuality} sibuk di CDN Google. Silakan klik resolusi lain di atas!
                    </div>
                `;
            }
        };
    }
}

/**
 * Fungsi untuk menghentikan player dan menghapus container multimedia dari halaman web
 */
function closeInlineVideoPlayer() {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    if (mizuPlyrInstance) {
        const videoElement = document.getElementById("mizu-inline-video-element");
        if (videoElement) videoElement.onerror = null;
        mizuPlyrInstance.destroy();
        mizuPlyrInstance = null;
    }
    if (inlineContainer) {
        inlineContainer.remove();
    }
}
