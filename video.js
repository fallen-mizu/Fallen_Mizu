// =================================================================
// MIZU PLAYER - VIDEO INTEGRATION (video.js)
// =================================================================

// Fungsi untuk memutar Video dengan pilihan resolusi langsung
async function playVideoTrack(videoId, title) {
    // 1. Buat atau cari elemen kontainer video melayang (Modal Overlay)
    let videoModal = document.getElementById("mizu-video-modal");
    if (!videoModal) {
        videoModal = document.createElement("div");
        videoModal.id = "mizu-video-modal";
        videoModal.style = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; font-family: inherit;";
        document.body.appendChild(videoModal);
    }
    videoModal.style.display = "flex";

    // Tampilkan status loading awal
    videoModal.innerHTML = `
        <div id="video-loader" style="color: white; font-size: 0.9rem; text-align: center;">
            <div style="font-weight: bold; margin-bottom: 10px; color: #BC002D;">MIZU VIDEO PLAYER</div>
            <div style="font-size: 0.8rem; opacity: 0.8;">Fetching video data...</div>
        </div>
    `;

    // Ambil data resolusi langsung dari API Zenzxz
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const apiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(videoUrl)}&format=mp4`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.status || !data.result || !data.result.download) {
            throw new Error("Gagal mengambil data video dari server.");
        }

        // Simpan url dasar hasil ekstraksi API
        const rawDownloadUrl = data.result.download;

        // Render struktur Pemutar Video Premium
        videoModal.innerHTML = `
            <div onclick="closeVideoPlayer()" style="position: absolute; top: 20px; right: 25px; color: white; font-size: 2rem; cursor: pointer; user-select: none; font-weight: 300;">&times;</div>
            
            <div style="color: white; font-size: 0.85rem; font-weight: 600; text-align: center; margin-bottom: 15px; width: 100%; max-width: 500px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 10px;">
                ${title}
            </div>

            <video id="mizu-video-element" controls autoplay style="width: 100%; max-width: 500px; border-radius: 8px; background: black; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"></video>
            
            <div style="margin-top: 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;">
                <label style="color: rgba(255,255,255,0.6); font-size: 0.7rem; font-weight: bold; letter-spacing: 1px;">CHOOSE RESOLUTION</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
                    <button class="res-btn" onclick="changeResolution('${rawDownloadUrl}', '144')">144p</button>
                    <button class="res-btn" onclick="changeResolution('${rawDownloadUrl}', '360')">360p</button>
                    <button class="res-btn" onclick="changeResolution('${rawDownloadUrl}', '480')">480p</button>
                    <button class="res-btn" onclick="changeResolution('${rawDownloadUrl}', '720')">720p</button>
                    <button class="res-btn" onclick="changeResolution('${rawDownloadUrl}', '1080')">1080p</button>
                </div>
            </div>

            <style>
                .res-btn {
                    background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);
                    padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
                }
                .res-btn:shadow, .res-btn.active-res {
                    background: #BC002D !important; border-color: #BC002D !important; box-shadow: 0 2px 8px rgba(188,0,45,0.4);
                }
            </style>
        `;

        // Setel default awal ke resolusi 720p agar jernih saat pertama dimuat
        changeResolution(rawDownloadUrl, "720");

    } catch (err) {
        console.error("Mizu Video Error:", err);
        videoModal.innerHTML = `
            <div style="color: white; text-align: center; font-size: 0.85rem; padding: 20px;">
                <div style="color: #BC002D; font-weight: bold; margin-bottom: 8px;">SERVER BUSY</div>
                <div style="opacity: 0.7; margin-bottom: 15px;">Gagal memuat stream video. Coba video atau resolusi lainnya.</div>
                <button onclick="closeVideoPlayer()" style="background: white; color: black; border: none; padding: 8px 20px; border-radius: 20px; font-weight: bold; cursor: pointer;">Close</button>
            </div>
        `;
    }
}

// Fungsi untuk mengganti resolusi video secara dinamis
function changeResolution(baseUrl, resolution) {
    const videoElement = document.getElementById("mizu-video-element");
    if (!videoElement) return;

    // Tandai tombol resolusi yang sedang aktif secara visual
    document.querySelectorAll(".res-btn").forEach(btn => {
        if (btn.textContent.includes(resolution)) {
            btn.classList.add("active-res");
        } else {
            btn.classList.remove("active-res");
        }
    });

    // Ambil detik berjalan saat ini agar saat ganti resolusi tidak mengulang dari menit 0
    const currentTime = videoElement.currentTime;
    const isPaused = videoElement.paused;

    // 🔥 Manipulasi URL biner API Zenzxz untuk menyuntikkan parameter resolusi murni angka
    // Menghapus query quality bawaan jika ada, lalu menggantinya dengan target angka resolusi kamu
    let cleanUrl = baseUrl.split('&quality=')[0].split('&resolusi=')[0];
    let finalVideoUrl = `${cleanUrl}&resolusi=${resolution}`;

    // Terapkan ke pemutar video
    videoElement.src = finalVideoUrl;
    videoElement.load();

    // Kembalikan posisi detik video sebelum ganti kualitas
    videoElement.currentTime = currentTime;
    if (!isPaused) {
        videoElement.play().catch(() => {});
    }
}

// Fungsi untuk menutup pemutar video modal
function closeVideoPlayer() {
    const videoModal = document.getElementById("mizu-video-modal");
    const videoElement = document.getElementById("mizu-video-element");
    if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
    }
    if (videoModal) videoModal.style.display = "none";
          }
          
