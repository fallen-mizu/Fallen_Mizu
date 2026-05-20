// =================================================================
// MIZU PLAYER - PERFECT PATH-INJECTION PLYR INTEGRATION (video.js)
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
    
    inlineVideoContainer.innerHTML = `
        <div id="video-loader" style="text-align: center; padding: 15px 0;">
            <div style="font-weight: bold; font-size: 0.8rem; color: #BC002D; letter-spacing: 0.5px;">🎬 MIZU MULTIMEDIA ENGINE</div>
            <div style="font-size: 0.7rem; opacity: 0.6; font-style: italic; margin-top: 3px;">Initializing ultra-lightweight player...</div>
        </div>
    `;

    const cleanVideoId = videoId.replace("youtube_", "").trim();
    inlineVideoContainer.setAttribute("data-active-id", cleanVideoId);
    inlineVideoContainer.setAttribute("data-active-title", title);

    // Kita mulai dari resolusi standar yang stabil
    loadInlineResolution("360");
}

function loadInlineResolution(targetQuality) {
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

    // Di dalam file video.js, ubah baris rakitan URL-nya menjadi seperti ini:
const finalVercelProxyUrl = `/api/search?id=${encodeURIComponent(videoId)}&stream=true`;
    

    inlineContainer.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: bold; color: #333; text-align: center; margin-bottom: 12px; width: 100%; max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px;">
            📺 Playing Video: <span style="font-weight: 500; color: #666;">${title}</span>
        </div>

        <div style="position: relative; width: 100%; max-width: 450px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            <video id="mizu-inline-video-element" playsinline controls crossorigin="anonymous">
                <source src="${finalVercelProxyUrl}" type="video/mp4" />
            </video>
            <div onclick="closeInlineVideoPlayer()" style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; font-weight: bold; z-index: 10; user-select: none; -webkit-tap-highlight-color: transparent;">×</div>
        </div>
        
        <div style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;">
            <label style="color: #999; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Mizu Quality Selector (Direct Injection)</label>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
                <button class="inline-res-btn" data-res="144" onclick="loadInlineResolution('144')">144p</button>
                <button class="inline-res-btn" data-res="240" onclick="loadInlineResolution('240')">240p</button>
                <button class="inline-res-btn" data-res="360" onclick="loadInlineResolution('360')">360p</button>
                <button class="inline-res-btn" data-res="480" onclick="loadInlineResolution('480')">480p</button>
                <button class="inline-res-btn" data-res="720" onclick="loadInlineResolution('720')">720p</button>
                <button class="inline-res-btn" data-res="1080" onclick="loadInlineResolution('1080')">1080p</button>
            </div>
            <div id="codec-fallback-ui" style="margin-top: 5px;"></div>
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
        tooltips: { controls: false, seek: true },
        ratio: '16:9',
        blankVideo: 'https://cdn.plyr.io/static/blank.mp4'
    });

    mizuPlyrInstance.on('ready', () => {
        mizuPlyrInstance.currentTime = lastTimestamp;
        if (isPlaying) {
            mizuPlyrInstance.play().catch(e => console.log("Autoplay block bypass:", e));
        }
    });

    document.querySelectorAll(".inline-res-btn").forEach(btn => {
        if (btn.getAttribute("data-res") === targetQuality) {
            btn.classList.add("active-inline-res");
        }
    });

    inlineContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const videoElement = document.getElementById("mizu-inline-video-element");
    if (videoElement) {
        videoElement.onerror = () => {
            const fallbackUi = document.getElementById("codec-fallback-ui");
            if (fallbackUi) {
                fallbackUi.innerHTML = `
                    <div style="font-size: 0.7rem; color: #BC002D; font-weight: bold; margin-bottom: 5px;">
                        ⚠️ Gagal memuat stream video.
                    </div>
                    <a href="${finalVercelProxyUrl}" target="_blank" download="video.mp4" style="font-size: 0.65rem; color: #333; font-weight: bold; text-decoration: underline;">
                        Klik disini untuk mencoba download langsung.
                    </a>
                `;
            }
        };
    }
}

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
    
