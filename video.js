// Fungsi penyuplai stream video dari Worker ke Tag HTML5 Video secara menetap
function loadInlineResolution(resolution) {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    if (!inlineContainer) return;

    const videoId = inlineContainer.getAttribute("data-active-id");
    const title = inlineContainer.getAttribute("data-active-title");

    // Catat detik berjalan saat ini agar saat ganti resolusi tidak kembali ke awal (seamless)
    const oldVideo = document.getElementById("mizu-inline-video-element");
    let lastTimestamp = 0;
    let isPlaying = true;
    if (oldVideo) {
        lastTimestamp = oldVideo.currentTime;
        isPlaying = !oldVideo.paused;
    }

    // 🔥 FORMULA BARU: Mengubah &res= menjadi &format= sesuai permintaanmu
    const finalWorkerStreamUrl = `${CLOUDFLARE_WORKER_VIDEO_URL}?id=${encodeURIComponent(videoId)}&format=${resolution}`;

    // Bangun UI Player menetap di bawah daftar 5 lagu
    inlineContainer.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: bold; color: #333; text-align: center; margin-bottom: 12px; width: 100%; max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px;">
            📺 Playing Video: <span style="font-weight: 500; color: #666;">${title}</span>
        </div>

        <div style="position: relative; width: 100%; max-width: 450px;">
            <video id="mizu-inline-video-element" controls preload="auto" crossorigin="anonymous" style="width: 100%; border-radius: 12px; background: #000; box-shadow: 0 4px 15px rgba(0,0,0,0.08); outline: none; display: block;"></video>
            <div onclick="closeInlineVideoPlayer()" style="position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; background: #333; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.2); user-select: none; -webkit-tap-highlight-color: transparent;">×</div>
        </div>
        
        <div style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;">
            <label style="color: #999; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Mizu Quality Selector (Bypassed)</label>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
                <button class="inline-res-btn" data-res="144" onclick="loadInlineResolution('144')">144p</button>
                <button class="inline-res-btn" data-res="240" onclick="loadInlineResolution('240')">240p</button>
                <button class="inline-res-btn" data-res="360" onclick="loadInlineResolution('360')">360p</button>
                <button class="inline-res-btn" data-res="480" onclick="loadInlineResolution('480')">480p</button>
                <button class="inline-res-btn" data-res="720" onclick="loadInlineResolution('720')">720p</button>
                <button class="inline-res-btn" data-res="1080" onclick="loadInlineResolution('1080')">1080p</button>
            </div>
        </div>

        <style>
            .inline-res-btn {
                background: #ffffff; color: #555; border: 1px solid rgba(0,0,0,0.08);
                padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; cursor: pointer; transition: all 0.2s; -webkit-tap-highlight-color: transparent;
            }
            .inline-res-btn:hover { background: #f9f9f9; }
            .inline-res-btn.active-inline-res {
                background: #BC002D !important; color: white !important; border-color: #BC002D !important; box-shadow: 0 2px 6px rgba(188, 0, 45, 0.25);
            }
        </style>
    `;

    const videoElement = document.getElementById("mizu-inline-video-element");
    
    videoElement.src = finalWorkerStreamUrl;
    videoElement.load();
    
    videoElement.currentTime = lastTimestamp;

    document.querySelectorAll(".inline-res-btn").forEach(btn => {
        if (btn.getAttribute("data-res") === resolution) {
            btn.classList.add("active-inline-res");
        }
    });

    inlineContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });

    videoElement.onerror = () => {
        console.error("Mizu Player - Stream Loading Failed for URL:", finalWorkerStreamUrl);
        alert("Aduh, link stream untuk resolusi " + resolution + "p gagal direspon oleh Cloudflare Worker. Silakan coba resolusi lainnya!");
    };

    if (isPlaying) {
        videoElement.play().catch(e => console.log("Autoplay blocked by browser rule:", e));
    }
}
