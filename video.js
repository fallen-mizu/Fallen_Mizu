// =================================================================
// MIZU MULTIMEDIA ENGINE - UTILITY EMBED PLAYER REBUILD (video.js)
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
    
    // Simpan data state aktif ke container
    inlineVideoContainer.setAttribute("data-active-id", cleanVideoId);
    inlineVideoContainer.setAttribute("data-active-title", title);

    // Hancurkan instance lama jika ada sebelum membuat yang baru agar memori bersih
    if (mizuPlyrInstance) {
        mizuPlyrInstance.destroy();
        mizuPlyrInstance = null;
    }

    // Render struktur HTML Player menggunakan provider native YouTube dengan aspek rasio stabil
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
        
        <div style="margin-top: 12px; display: flex; flex-direction: column; align-items: center; width: 100%;">
            <label style="color: #999; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Mizu Client Stream Tunnel</label>
            <div style="font-size: 0.65rem; color: #666; margin-top: 4px; font-style: italic; text-align: center; padding: 0 10px;">
                ⚙️ Quality controls & captions are synchronized inside the player cog icon.
            </div>
        </div>

        <style>
            :root {
                --plyr-color-main: #BC002D; /* Warna Crimson kebanggaan Mizu */
                --plyr-video-control-background-hover: rgba(188, 0, 45, 0.2);
            }
            .plyr { border-radius: 12px; width: 100%; }
            
            /* 🔥 PERBAIKAN CSS: Mengembalikan ukuran normal agar popup menu resolusi tidak terpotong */
            .plyr__video-embed iframe { 
                top: 0 !important; 
                height: 100% !important; 
                transform: scale(1.01); /* Menghilangkan sisa border tipis bawaan iframe */
            }
        </style>
    `;

    // Inisialisasi ulang instance Plyr dengan opsi pengaturan paksa parameter kualitas
    mizuPlyrInstance = new Plyr("#mizu-inline-video-element", {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
        settings: ['quality', 'speed'], // Paksa opsi 'quality' masuk ke daftar menu utama gerigi bersama speed
        youtube: { 
            noCookie: true, 
            rel: 0, 
            showinfo: 0, 
            iv_load_policy: 3, 
            modestbranding: 1 
        }
    });

    // Otomatis putar jika player sudah siap mendengarkan data
    mizuPlyrInstance.on('ready', () => {
        mizuPlyrInstance.play().catch(e => console.log("Autoplay context handled:", e));
    });

    // Gulir halus ke area pemutar video
    inlineVideoContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Fungsi untuk menghentikan player dan menghapus container multimedia dari halaman web
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
