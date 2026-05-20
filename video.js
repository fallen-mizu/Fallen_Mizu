// =================================================================
// MIZU PLAYER - CLOUDFLARE WORKER DYNAMIC RESOLUTION INTEGRATION
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

    const cleanVideoId = videoId.replace("youtube_", "").trim();
    inlineVideoContainer.setAttribute("data-active-id", cleanVideoId);
    inlineVideoContainer.setAttribute("data-active-title", title);

    inlineVideoContainer.innerHTML = `
        <div id="video-loader" style="text-align: center; padding: 25px 0;">
            <div style="font-weight: bold; font-size: 0.8rem; color: #BC002D; letter-spacing: 0.5px;">🎬 MIZU ENGINE v2 (Cloudflare Workers)</div>
            <div style="font-size: 0.7rem; opacity: 0.6; font-style: italic; margin-top: 3px;">Analyzing YouTube resolutions & FPS support...</div>
        </div>
    `;

    try {
        // 1. Ambil resolusi yang didukung asli oleh video ini via Vercel -> Cloudflare Worker Meta
        const metaResponse = await fetch(`/api/search?id=${encodeURIComponent(cleanVideoId)}&stream=true&meta=true`);
        const metaData = await metaResponse.json();

        // Ambil list resolusi yang didukung asli (Contoh: ["144", "240", "360", "480", "720", "1080p60"])
        const dynamicQualities = metaData.qualities || ["144", "240", "360", "480"];

        // Set resolusi awal otomatis ke yang paling stabil (360p atau resolusi tertinggi yang ada)
        const initialQuality = dynamicQualities.includes("360") ? "360" : dynamicQualities[0];
        
        // 2. Render Player dengan tombol resolusi dinamis asli YouTube
        loadInlineResolutionWithQualities(initialQuality, dynamicQualities);

    } catch (e) {
        console.error("Failed to load meta resolutions:", e);
        // Fallback jika meta gagal, pakai profil standar max 480p
        loadInlineResolutionWithQualities("360", ["144", "240", "360", "480"]);
    }
}

function loadInlineResolutionWithQualities(targetQuality, allowedQualitiesList) {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    if (!inlineContainer) return;

    const videoId = inlineContainer.getAttribute("data-active-id");
    const title = inlineContainer.getAttribute("data-active-title");

    let lastTimestamp = 0;
    let isPlaying = true;
    
    if (mizuPlyrInstance) {
        lastTimestamp = mizuPlyrInstance.currentTime;
        isPlaying = mizuPlyrInstance.playing;
        mizuPlyrInstance.destroy();
        mizuPlyrInstance = null;
    }

    // Arahkan source langsung ke proxy stream biner Vercel yang akan di-redirect ke Cloudflare Worker
    const finalVercelProxyUrl = `/api/search?id=${encodeURIComponent(videoId)}&format=${targetQuality}&stream=true`;

    // 3. Bangun tombol resolusi secara dinamis berdasar array allowedQualitiesList
    let resolutionButtonsHtml = '';
    allowedQualitiesList.forEach(q => {
        // Tampilkan teks kustom jika resolusi mendukung 60fps
        let buttonLabel = q.includes("p60") ? q : `${q}p`;
        resolutionButtonsHtml += `
            <button class="inline-res-btn" data-res="${q}" onclick="loadInlineResolutionWithQualities('${q}', [${allowedQualitiesList.map(item => `'${item}'`).join(',')}])">
                ${buttonLabel}
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
            <label style="color: #999; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Mizu Resolution Tracker (Max 1080p)</label>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
                ${resolutionButtonsHtml}
            </div>
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

    mizuPlyrInstance = new Plyr("#mizu-inline-video-element", {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        ratio: '16:9'
    });

    mizuPlyrInstance.on('ready', () => {
        mizuPlyrInstance.currentTime = lastTimestamp;
        if (isPlaying) {
            mizuPlyrInstance.play().catch(e => console.log("Workers Autoplay success", e));
        }
    });

    // Nyalakan class active pada tombol kualitas pilihan saat ini
    document.querySelectorAll(".inline-res-btn").forEach(btn => {
        if (btn.getAttribute("data-res") === targetQuality) {
            btn.classList.add("active-inline-res");
        }
    });

    inlineContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
