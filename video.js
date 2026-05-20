// =================================================================
// MIZU PLAYER - CLIENT DIRECT INJECTION PERFORMANCE MODE (video.js)
// =================================================================

let mizuPlyrInstance = null;

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
    
    // Tampilkan animasi loading mizu saat backend sedang melakukan jabat tangan ke API
    inlineVideoContainer.innerHTML = `
        <div id="video-loader" style="text-align: center; padding: 30px 0; width: 100%; max-width: 450px; background: #fafafa; border-radius: 12px; border: 1px dashed rgba(0,0,0,0.05);">
            <div style="font-weight: bold; font-size: 0.8rem; color: #BC002D; letter-spacing: 0.5px; animation: pulse 1.5s infinite;">🎬 MIZU MULTIMEDIA ENGINE</div>
            <div style="font-size: 0.7rem; opacity: 0.6; font-style: italic; margin-top: 4px;">Fetching direct stream link from server...</div>
        </div>
        <style>
            @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        </style>
    `;

    const cleanVideoId = videoId.replace("youtube_", "").trim();
    
    try {
        // 1. Ambil URL video mentah dari backend Vercel kita
        const response = await fetch(`/api/search?id=${encodeURIComponent(cleanVideoId)}&stream=true`);
        const data = await response.json();

        if (!data.status || !data.videoUrl) {
            throw new Error(data.error || "Link download kosong");
        }

        // 2. Jika link berhasil didapatkan, hancurkan loader dan bangun Plyr Player
        buildMizuPlayer(inlineVideoContainer, data.videoUrl, title);

    } catch (err) {
        console.error("Mizu Player Core Failure:", err);
        inlineVideoContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; background: #fff5f5; border-radius: 12px; width: 100%; max-width: 450px; border: 1px solid #ffe3e3;">
                <div style="font-size: 0.75rem; color: #BC002D; font-weight: bold;">⚠️ Gagal Memuat Video (Enkripsi Hak Cipta / Server Down)</div>
                <div style="font-size: 0.65rem; color: #666; margin-top: 4px;">Video ini dilindungi hak cipta ketat atau API sedang overload.</div>
                <button onclick="closeInlineVideoPlayer()" style="margin-top: 10px; background: #333; color: white; border: none; padding: 5px 12px; font-size: 0.65rem; border-radius: 15px; cursor: pointer;">Tutup Player</button>
            </div>
        `;
    }
}

function buildMizuPlayer(container, finalDirectVideoUrl, title) {
    if (mizuPlyrInstance) {
        mizuPlyrInstance.destroy();
        mizuPlyrInstance = null;
    }

    container.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: bold; color: #333; text-align: center; margin-bottom: 12px; width: 100%; max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px;">
            📺 Playing Video: <span style="font-weight: 500; color: #666;">${title}</span>
        </div>

        <div style="position: relative; width: 100%; max-width: 450px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            <video id="mizu-inline-video-element" playsinline controls crossorigin="anonymous">
                <source src="${finalDirectVideoUrl}" type="video/mp4" />
            </video>
            <div onclick="closeInlineVideoPlayer()" style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; font-weight: bold; z-index: 10; user-select: none; -webkit-tap-highlight-color: transparent;">×</div>
        </div>

        <style>
            :root {
                --plyr-color-main: #BC002D;
                --plyr-video-control-background-hover: rgba(188, 0, 45, 0.2);
            }
            .plyr { border-radius: 12px; }
        </style>
    `;

    // Inisialisasi Plyr Core
    mizuPlyrInstance = new Plyr("#mizu-inline-video-element", {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        tooltips: { controls: false, seek: true },
        ratio: '16:9'
    });

    mizuPlyrInstance.on('ready', () => {
        mizuPlyrInstance.play().catch(e => console.log("Autoplay context block bypassed", e));
    });

    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

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
