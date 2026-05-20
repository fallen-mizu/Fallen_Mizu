// =================================================================
// MIZU MULTIMEDIA ENGINE - FULL REBUILD FRONTEND CORE (video.js)
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

    // Cari atau buat container video inline di bawah daftar lagu jika belum ada
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

    // Render state loading transparan saat menganalisis manifest trek di Cloudflare Workers
    inlineVideoContainer.innerHTML = `
        <div id="video-loader" style="text-align: center; padding: 35px 0; width: 100%; max-width: 450px; background: #fafafa; border-radius: 12px; border: 1px dashed rgba(0,0,0,0.05);">
            <div style="font-weight: bold; font-size: 0.8rem; color: #BC002D; letter-spacing: 0.5px; animation: mizuPulse 1.5s infinite;">🎬 MIZU NATIVE ENGINE v6</div>
            <div style="font-size: 0.7rem; opacity: 0.6; font-style: italic; margin-top: 5px;">Synchronizing bypass streams from Cloudflare edge...</div>
        </div>
        <style>
            @keyframes mizuPulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        </style>
    `;

    try {
        // 1. Lakukan pre-fetch meta data untuk memetakan kapasitas resolusi asli video tersebut
        const metaResponse = await fetch(`/api/search?id=${encodeURIComponent(cleanVideoId)}&stream=true&meta=true`);
        const metaData = await metaResponse.json();

        // Ambil array profil resolusi global (contoh: ["144p", "240p", "360p", "480p", "720p", "1080p60"])
        const dynamicQualities = metaData.qualities || ["144p", "240p", "360p", "480p", "720p", "1080p60"];

        // Tentukan kualitas pemutaran awal (Utamakan 360p agar start buffer instan di perangkat seluler)
        let initialQuality = "360p";
        if (!dynamicQualities.includes("360p")) {
            initialQuality = dynamicQualities.includes("480p") ? "480p" : dynamicQualities[0];
        }

        // 2. Lempar data manifes ke fungsi renderer komponen pemutar
        loadInlineResolutionWithQualities(initialQuality, dynamicQualities);

    } catch (e) {
        console.error("Mizu Core Metadata Extractor Failed:", e);
        // Fallback aman jika gateway serverless sedang sibuk, paksa profil standar umum
        loadInlineResolutionWithQualities("360p", ["144p", "240p", "360p", "480p", "720p", "1080p60"]);
    }
}

/**
 * Fungsi untuk merender ulang antarmuka Plyr berdasarkan kualitas resolusi yang dipilih
 * @param {string} targetQuality - Label kualitas aktif yang dipilih (misal: "1080p60")
 * @param {Array} allowedQualitiesList - Kumpulan array string resolusi global video tersebut
 */
function loadInlineResolutionWithQualities(targetQuality, allowedQualitiesList) {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    if (!inlineContainer) return;

    const videoId = inlineContainer.getAttribute("data-active-id");
    const title = inlineContainer.getAttribute("data-active-title");

    // Amankan posisi durasi detik terakhir dan status play/pause video agar tidak terreset saat ganti resolusi
    let lastTimestamp = 0;
    let isPlaying = true;
    
    if (mizuPlyrInstance) {
        lastTimestamp = mizuPlyrInstance.currentTime;
        isPlaying = mizuPlyrInstance.playing;
        mizuPlyrInstance.destroy();
        mizuPlyrInstance = null;
    }

    // ⚡️ EKSTRAKSI ANGKA MURNI: Mengubah string label seperti "1080p60" atau "720p" menjadi murni "1080" atau "720"
    // Ini dikirim agar router API Vercel & Worker Cloudflare mencocokkan query dengan tepat
    const cleanFormatNumber = targetQuality.replace("p", "").replace("60", "").trim();

    // Jalur proxy stream final ter-bypass CORS
    const finalVercelProxyUrl = `/api/search?id=${encodeURIComponent(videoId)}&format=${cleanFormatNumber}&stream=true`;

    // 3. Bangun struktur tombol resolusi dinamis berbasis array string
    let resolutionButtonsHtml = '';
    allowedQualitiesList.forEach(q => {
        // Enkode isi array string ke format JSON string agar aman disuntikkan ke dalam inline attribute onclick
        const escapedListStr = JSON.stringify(allowedQualitiesList).replace(/"/g, "'");
        
        resolutionButtonsHtml += `
            <button class="inline-res-btn" data-res="${q}" onclick="loadInlineResolutionWithQualities('${q}', ${escapedListStr})">
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

    // 4. Inisialisasi ulang instance Plyr HTML5 Player
    mizuPlyrInstance = new Plyr("#mizu-inline-video-element", {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        tooltips: { controls: false, seek: true },
        ratio: '16:9'
    });

    // Pasang ulang posisi durasi detik terakhir sebelum resolusi diubah
    mizuPlyrInstance.on('ready', () => {
        mizuPlyrInstance.currentTime = lastTimestamp;
        if (isPlaying) {
            mizuPlyrInstance.play().catch(e => console.log("Bypass autoplay restriction handled:", e));
        }
    });

    // Beri penanda warna Crimson (#BC002D) pada tombol resolusi yang sedang aktif
    document.querySelectorAll(".inline-res-btn").forEach(btn => {
        if (btn.getAttribute("data-res") === targetQuality) {
            btn.classList.add("active-inline-res");
        }
    });

    // Gulir layar secara halus agar player fokus ke area tengah viewport
    inlineContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Pasang sistem pendeteksi kegagalan biner pada tag video native HTML5
    const videoElement = document.getElementById("mizu-inline-video-element");
    if (videoElement) {
        videoElement.onerror = () => {
            const errorUi = document.getElementById("mizu-codec-error-ui");
            if (errorUi) {
                errorUi.innerHTML = `
                    <div style="font-size: 0.65rem; color: #BC002D; font-weight: bold; text-align: center;">
                        ⚠️ Jalur stream ${targetQuality} sedang memuat ulang. Silakan pilih resolusi lain jika macet!
                    </div>
                `;
            }
        };
    }
}

/**
 * Fungsi untuk menghentikan instansiasi player dan membersihkan container multimedia dari DOM
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
    
