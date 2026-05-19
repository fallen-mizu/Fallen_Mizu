// =================================================================
// MIZU PLAYER - INLINE VIDEO INTEGRATION (video.js) VIA CF WORKER
// =================================================================

// KUNCI UTAMA: Ubah ini menjadi URL murni Cloudflare Worker milikmu!
const CLOUDFLARE_WORKER_VIDEO_URL = "https://mizu-api-video.tohsakarin756.workers.dev";

// Fungsi utama untuk memutar Video secara menetap di bawah list lagu
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
    
    // Tampilkan loader status interkoneksi mesin multimedia
    inlineVideoContainer.innerHTML = `
        <div id="video-loader" style="text-align: center; padding: 15px 0;">
            <div style="font-weight: bold; font-size: 0.8rem; color: #BC002D; letter-spacing: 0.5px;">🎬 MIZU MULTIMEDIA ENGINE</div>
            <div style="font-size: 0.7rem; opacity: 0.6; font-style: italic; margin-top: 3px;">Processing via /api/search gateway...</div>
        </div>
    `;

    try {
        // 🔥 LANGKAH TEROBOSAN: Tembak ke endpoint search internal untuk memproses ID dan judul video
        // Menggunakan title/videoId sebagai query parameter agar diolah oleh search.js Vercel
        const searchGatewayUrl = `/api/search?id=${encodeURIComponent(videoId)}&title=${encodeURIComponent(title)}`;
        const gatewayResponse = await fetch(searchGatewayUrl);
        
        if (!gatewayResponse.ok) {
            throw new Error(`Gateway search error dengan status: ${gatewayResponse.status}`);
        }

        const gatewayData = await gatewayResponse.json();
        console.log("Gateway Search Resolved Data:", gatewayData);

        // Ambil ID murni hasil ekstraksi search.js (pastikan fallback menggunakan videoId lama jika key berbeda)
        const verifiedVideoId = gatewayData?.id || gatewayData?.videoId || videoId;
        const verifiedTitle = gatewayData?.title || title;

        // Set atribut data pada kontainer HTML menggunakan data hasil kelola /api/search
        inlineVideoContainer.setAttribute("data-active-id", verifiedVideoId);
        inlineVideoContainer.setAttribute("data-active-title", verifiedTitle);

        // Langsung muat resolusi default 360p melalui jembatan worker menggunakan ID tervalidasi
        loadInlineResolution("360");

    } catch (gatewayError) {
        console.error("Mizu Multimedia Gateway Error:", gatewayError);
        inlineVideoContainer.innerHTML = `
            <div style="text-align: center; padding: 10px; color: #BC002D; font-size: 0.75rem; font-weight: bold;">
                ❌ Gagal memproses video melalui /api/search. Mencoba fallback langsung...
            </div>
        `;
        // Fallback langsung menggunakan data awal jika route api/search down
        setTimeout(() => {
            inlineVideoContainer.setAttribute("data-active-id", videoId);
            inlineVideoContainer.setAttribute("data-active-title", title);
            loadInlineResolution("360");
        }, 1500);
    }
}

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

    // FORMULA BYPASS: Mengarahkan data id bersih ke Cloudflare Worker
    const finalWorkerStreamUrl = `${CLOUDFLARE_WORKER_VIDEO_URL}?id=${encodeURIComponent(videoId)}&res=${resolution}`;

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
    
    // Suntikkan link stream worker biner murni
    videoElement.src = finalWorkerStreamUrl;
    videoElement.load();
    
    // Kembalikan posisi durasi menonton agar tidak tersendat saat ganti kualitas
    videoElement.currentTime = lastTimestamp;

    // Beri warna pembeda pada tombol resolusi aktif yang sedang berjalan
    document.querySelectorAll(".inline-res-btn").forEach(btn => {
        if (btn.getAttribute("data-res") === resolution) {
            btn.classList.add("active-inline-res");
        }
    });

    // Geser scroll browser dengan lembut agar terfokus ke area video player
    inlineContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Penanganan error stream dengan pelacakan log yang akurat
    videoElement.onerror = () => {
        console.error("Mizu Player - Stream Load Failed for URL:", finalWorkerStreamUrl);
        alert("Aduh, link stream untuk resolusi ini gagal direspon oleh Cloudflare Worker. Silakan coba resolusi lainnya!");
        closeInlineVideoPlayer();
    };

    if (isPlaying) {
        videoElement.play().catch(e => console.log("Autoplay blocked by browser rule:", e));
    }
}

// Fungsi penghancur element player menetap jika ditekan tombol close bulat silang
function closeInlineVideoPlayer() {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    const videoElement = document.getElementById("mizu-inline-video-element");
    if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
    }
    if (inlineContainer) {
        inlineContainer.remove();
    }
}
