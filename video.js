// =================================================================
// MIZU PLAYER - VIDEO INTEGRATION (video.js) - REBUILD 2026
// =================================================================

// Fungsi utama untuk memunculkan modal dan memutar video
async function playVideoTrack(videoId, title) {
    // 1. Buat kontainer modal jika belum ada di DOM
    let videoModal = document.getElementById("mizu-video-modal");
    if (!videoModal) {
        videoModal = document.createElement("div");
        videoModal.id = "mizu-video-modal";
        videoModal.style = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; font-family: inherit; backdrop-filter: blur(10px);";
        document.body.appendChild(videoModal);
    }
    videoModal.style.display = "flex";

    // Tampilkan animasi loading mizu awal
    videoModal.innerHTML = `
        <div id="video-loader" style="color: white; font-size: 0.9rem; text-align: center;">
            <div style="font-weight: bold; margin-bottom: 10px; color: #BC002D; letter-spacing: 1px;">🎬 MIZU MULTIMEDIA PLAYER</div>
            <div style="font-size: 0.8rem; opacity: 0.6; font-style: italic;">Requesting stream ticket from Zenzxz...</div>
        </div>
    `;

    // Kita sediakan videoId ke cakupan global modal agar fungsi ganti resolusi bisa memanggilnya ulang
    videoModal.setAttribute("data-active-id", videoId);
    videoModal.setAttribute("data-active-title", title);

    // Langsung memuat video dengan resolusi standar (Default: 360p agar cepat dimuat di awal)
    loadVideoResolution("360");
}

// Fungsi internal khusus untuk merequest stream video berdasarkan tingkat resolusi
async function loadVideoResolution(resolution) {
    const videoModal = document.getElementById("mizu-video-modal");
    if (!videoModal) return;

    const videoId = videoModal.getAttribute("data-active-id");
    const title = videoModal.getAttribute("data-active-title");

    try {
        // 🔥 PENYESUAIAN API: Menggunakan format resolusi angka murni seperti logika Bot WhatsApp kamu!
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const apiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(videoUrl)}&format=${resolution}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API returned status ${response.status}`);
        
        const data = await response.json();

        // Peta pengecekan struktur JSON bertingkat (Fallback Checker dari Bot WhatsApp kamu)
        let finalVideoUrl = 
            data?.result?.download || 
            data?.result?.url || 
            data?.downloadUrl || 
            data?.url || 
            data?.result?.video;

        if (!finalVideoUrl) {
            throw new Error("Link stream biner video tidak ditemukan dalam payload API.");
        }

        // Simpan posisi detik berjalan jika video element sudah pernah ada sebelumnya (seamless switching)
        const oldVideo = document.getElementById("mizu-video-element");
        let lastTimestamp = 0;
        let isPlaying = true;
        if (oldVideo) {
            lastTimestamp = oldVideo.currentTime;
            isPlaying = !oldVideo.paused;
        }

        // Bangun interface player premium mizu
        videoModal.innerHTML = `
            <div onclick="closeVideoPlayer()" style="position: absolute; top: 20px; right: 25px; color: white; font-size: 2.2rem; cursor: pointer; user-select: none; font-weight: 300; -webkit-tap-highlight-color: transparent;">&times;</div>
            
            <div style="color: white; font-size: 0.85rem; font-weight: 600; text-align: center; margin-bottom: 15px; width: 100%; max-width: 500px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 15px;">
                ${title}
            </div>

            <video id="mizu-video-element" controls preload="auto" style="width: 100%; max-width: 500px; border-radius: 12px; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.7); outline: none;"></video>
            
            <div style="margin-top: 25px; display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%;">
                <label style="color: rgba(255,255,255,0.4); font-size: 0.65rem; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;">Mizu Resolution Engine</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; max-width: 400px;">
                    <button class="res-btn" data-res="144" onclick="loadVideoResolution('144')">144p</button>
                    <button class="res-btn" data-res="240" onclick="loadVideoResolution('240')">240p</button>
                    <button class="res-btn" data-res="360" onclick="loadVideoResolution('360')">360p</button>
                    <button class="res-btn" data-res="480" onclick="loadVideoResolution('480')">480p</button>
                    <button class="res-btn" data-res="720" onclick="loadVideoResolution('720')">720p</button>
                    <button class="res-btn" data-res="1080" onclick="loadVideoResolution('1080')">1080p</button>
                </div>
            </div>

            <style>
                .res-btn {
                    background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.15);
                    padding: 8px 16px; border-radius: 30px; font-size: 0.75rem; font-weight: bold; cursor: pointer; transition: all 0.2s; -webkit-tap-highlight-color: transparent;
                }
                .res-btn:hover { background: rgba(255,255,255,0.2); color: #fff; }
                .res-btn.active-res {
                    background: #BC002D !important; color: white !important; border-color: #BC002D !important; box-shadow: 0 4px 12px rgba(188, 0, 45, 0.4);
                }
            </style>
        `;

        // Ambil element baru dan suntikkan direct video stream
        const videoElement = document.getElementById("mizu-video-element");
        videoElement.src = finalVideoUrl;
        
        // 🔥 BYPASS CLOUDFLARE FOR STREAMING: Paksa browser melakukan penarikan byte-range stream parsial murni frontend
        videoElement.load();
        
        // Kembalikan timeline detik pemutaran agar tidak mengulang dari awal saat berganti resolusi
        videoElement.currentTime = lastTimestamp;

        // Tandai tombol resolusi yang sedang aktif saat ini
        document.querySelectorAll(".res-btn").forEach(btn => {
            if (btn.getAttribute("data-res") === resolution) {
                btn.classList.add("active-res");
            }
        });

        if (isPlaying) {
            await videoElement.play().catch(e => console.log("Autoplay blocked by client rule:", e));
        }

    } catch (err) {
        console.error("Mizu Video Engine Error:", err);
        videoModal.innerHTML = `
            <div style="color: white; text-align: center; font-size: 0.85rem; padding: 30px; max-width: 350px; background: #111; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="color: #BC002D; font-weight: bold; font-size: 1rem; margin-bottom: 8px;">SERVER OVERLOAD</div>
                <div style="opacity: 0.6; margin-bottom: 20px; font-size: 0.75rem; line-height: 1.5;">Resolusi ${resolution}p saat ini sedang tidak tersedia atau server API Zenzxz mengalami limitasi internal.</div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="loadVideoResolution('360')" style="background: #333; color: white; border: none; padding: 8px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; cursor: pointer;">Coba 360p</button>
                    <button onclick="closeVideoPlayer()" style="background: white; color: black; border: none; padding: 8px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; cursor: pointer;">Tutup</button>
                </div>
            </div>
        `;
    }
}

// Fungsi global penutup modal video player
function closeVideoPlayer() {
    const videoModal = document.getElementById("mizu-video-modal");
    const videoElement = document.getElementById("mizu-video-element");
    if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
    }
    if (videoModal) {
        videoModal.style.display = "none";
        // Bersihkan sisa state penanda id
        videoModal.removeAttribute("data-active-id");
        videoModal.removeAttribute("data-active-title");
    }
}
