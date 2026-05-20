// =================================================================
// MIZU MULTIMEDIA ENGINE - EXTERNAL CONTROL REBUILD (video.js)
// =================================================================

let mizuPlyrInstance = null;

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

    if (mizuPlyrInstance) {
        mizuPlyrInstance.destroy();
        mizuPlyrInstance = null;
    }

    // Render ulang struktur UI: Kita buat tombol resolusi HTML kustom secara eksplisit
    inlineVideoContainer.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: bold; color: #333; text-align: center; margin-bottom: 12px; width: 100%; max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px;">
            📺 Playing Video: <span style="font-weight: 500; color: #666;">${title}</span>
        </div>

        <div style="position: relative; width: 100%; max-width: 450px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); background: #000;">
            <div class="plyr__video-embed" id="mizu-inline-video-element">
                <iframe
                    src="https://www.youtube.com/embed/${cleanVideoId}?iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1"
                    allowfullscreen
                    allowtransparency
                    allow="autoplay"
                ></iframe>
            </div>
            
            <div onclick="closeInlineVideoPlayer()" style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; font-weight: bold; z-index: 11; user-select: none; -webkit-tap-highlight-color: transparent;">×</div>
        </div>
        
        <div style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;">
            <label style="color: #999; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Mizu Native Quality Selector</label>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
                <button class="mizu-res-btn" data-quality="hd1080" onclick="changeMizuVideoQuality('hd1080', this)">1080p</button>
                <button class="mizu-res-btn" data-quality="hd720" onclick="changeMizuVideoQuality('hd720', this)">720p</button>
                <button class="mizu-res-btn" data-quality="large" onclick="changeMizuVideoQuality('large', this)">480p</button>
                <button class="mizu-res-btn active-mizu-res" data-quality="medium" onclick="changeMizuVideoQuality('medium', this)">360p</button>
            </div>
        </div>

        <style>
            :root {
                --plyr-color-main: #BC002D;
                --plyr-video-control-background-hover: rgba(188, 0, 45, 0.2);
            }
            .plyr { border-radius: 12px; width: 100%; }
            .plyr__video-embed iframe { top: 0 !important; height: 100% !important; transform: scale(1.01); }
            
            /* Styling Tombol Resolusi Kustom */
            .mizu-res-btn {
                background: #ffffff; color: #555; border: 1px solid rgba(0,0,0,0.08);
                padding: 5px 14px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; cursor: pointer; transition: all 0.2s; -webkit-tap-highlight-color: transparent;
            }
            .mizu-res-btn:hover { background: #f9f9f9; }
            .mizu-res-btn.active-mizu-res {
                background: #BC002D !important; color: white !important; border-color: #BC002D !important; box-shadow: 0 2px 6px rgba(188, 0, 45, 0.25);
            }
        </style>
    `;

    // Inisialisasi Plyr tanpa menu settings bawaan agar tidak membingungkan
    mizuPlyrInstance = new Plyr("#mizu-inline-video-element", {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }
    });

    mizuPlyrInstance.on('ready', () => {
        mizuPlyrInstance.play().catch(e => console.log("Autoplay handled:", e));
    });

    inlineVideoContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * 🔥 FUNGSI UTAMA BYPASS RESOLUSI
 * Mengubah kualitas video lewat interaksi API jembatan Plyr & YouTube
 * @param {string} qualityKey - Target parameter kualitas YouTube (medium, large, hd720, hd1080)
 * @param {HTMLElement} element - Elemen tombol yang diklik
 */
function changeMizuVideoQuality(qualityKey, element) {
    if (!mizuPlyrInstance || !mizuPlyrInstance.embed) return;

    try {
        // Tembak langsung ke internal embed YouTube player API
        // Referensi internal: 360p = medium, 480p = large, 720p = hd720, 1080p = hd1080
        mizuPlyrInstance.embed.setPlaybackQuality(qualityKey);
        
        // Perbarui highlight warna Crimson pada tombol aktif
        document.querySelectorAll(".mizu-res-btn").forEach(btn => btn.classList.remove("active-mizu-res"));
        element.classList.add("active-mizu-res");
        
        console.log(`Mizu Engine: Quality forced to ${qualityKey}`);
    } catch (error) {
        console.error("Failed to alter iframe execution quality:", error);
    }
}

/**
 * Fungsi menutup player
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
