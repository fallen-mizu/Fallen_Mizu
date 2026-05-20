// =================================================================
// MIZU MULTIMEDIA ENGINE - ADVANCED HLS STREAM INTERACTION (video.js)
// =================================================================

let mizuPlyrInstance = null;

// Load HLS.js secara dinamis untuk menangani streaming adaptif resolusi tinggi
if (!window.Hls) {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
    document.head.appendChild(script);
}

/**
 * Fungsi utama untuk menginisialisasi container player multimedia Mizu
 * @param {string} videoId - ID Video dari YouTube
 * @param {string} title - Judul video untuk ditampilkan di UI Player
 */
async function playVideoTrack(videoId, title) {
    const songListContainer = document.getElementById("yt-song-list");
    if (!songListContainer) return;

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

    // Hancurkan instance lama jika ada sebelum membuat yang baru
    if (mizuPlyrInstance) {
        mizuPlyrInstance.destroy();
        mizuPlyrInstance = null;
    }

    // Ubah parameter request ke Vercel backend untuk mengambil stream HLS (m3u8)
    const secureHlsStreamUrl = `/api/search?id=${encodeURIComponent(cleanVideoId)}&stream=true&type=hls`;

    // Render struktur HTML Player dengan tag video murni
    inlineVideoContainer.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: bold; color: #333; text-align: center; margin-bottom: 12px; width: 100%; max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px;">
            📺 Playing Video: <span style="font-weight: 500; color: #666;">${title}</span>
        </div>

        <div style="position: relative; width: 100%; max-width: 450px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); background: #000;">
            <video id="mizu-inline-video-element" playsinline controls crossorigin="anonymous" style="width: 100%; height: auto; display: block;"></video>
            <div onclick="closeInlineVideoPlayer()" style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; font-weight: bold; z-index: 10; user-select: none; -webkit-tap-highlight-color: transparent;">×</div>
        </div>
        
        <div style="margin-top: 12px; display: flex; flex-direction: column; align-items: center; width: 100%;">
            <label style="color: #999; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Mizu HLS Hybrid Tunnel</label>
            <div style="font-size: 0.65rem; color: #666; margin-top: 4px; font-style: italic; text-align: center; padding: 0 10px;">
                ⚙️ Quality selection is now fully active inside the settings cog icon.
            </div>
        </div>

        <style>
            :root {
                --plyr-color-main: #BC002D; /* Warna Crimson kebanggaan */
                --plyr-video-control-background-hover: rgba(188, 0, 45, 0.2);
            }
            .plyr { border-radius: 12px; width: 100%; }
        </style>
    `;

    const videoElement = document.getElementById("mizu-inline-video-element");

    // Inisialisasi HLS Engine jika browser mendukung (Android Chrome / PC)
    if (Hls.isSupported()) {
        const hls = new Hls({
            maxMaxBufferLength: 10 // Anti-lag, batasi buffer maksimal 10 detik di depan
        });
        hls.loadSource(secureHlsStreamUrl);
        hls.attachMedia(videoElement);
        
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            // Ambil semua tingkatan resolusi asli yang tersedia dari manifest (144p - 1080p)
            const availableQualities = hls.levels.map((l) => l.height);
            
            // Inisialisasi Plyr dengan opsi kualitas kustom
            mizuPlyrInstance = new Plyr(videoElement, {
                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
                settings: ['quality', 'speed'],
                quality: {
                    default: availableQualities[0] || 360,
                    options: availableQualities,
                    forced: true,
                    onChange: (newQuality) => {
                        // Jalankan perpindahan kualitas data di tingkat biner HLS
                        hls.levels.forEach((level, levelIndex) => {
                            if (level.height === newQuality) {
                                hls.currentLevel = levelIndex;
                            }
                        });
                    }
                }
            });
            mizuPlyrInstance.play().catch(e => console.log("Autoplay handled:", e));
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                console.log("HLS fatal error encountered, trying fallback...");
                // Fallback jika jalur m3u8 bermasalah, tembak MP4 langsung
                videoElement.src = `/api/search?id=${encodeURIComponent(cleanVideoId)}&stream=true&format=360`;
            }
        });
    } 
    // Fallback khusus untuk perangkat iOS Safari yang mendukung HLS secara native
    else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = secureHlsStreamUrl;
        mizuPlyrInstance = new Plyr(videoElement, {
            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen']
        });
        mizuPlyrInstance.play().catch(e => console.log("iOS Autoplay handled:", e));
    }

    inlineVideoContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Menghentikan dan membersihkan player
 */
function closeInlineVideoPlayer() {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    if (mizuPlyrInstance) {
        mizuPlyrInstance.destroy();
        mizuPlyrInstance = null;
    }
    if (inlineContainer) {
        inlineContainer.remove();
    }
            }
                        
