// =================================================================
// MIZU PLAYER - INLINE VIDEO INTEGRATION (video.js)
// =================================================================

// Fungsi utama untuk memutar Video secara menetap di bawah list lagu
async function playVideoTrack(videoId, title) {
    // Cari kontainer utama lagu
    const songListContainer = document.getElementById("yt-song-list");
    if (!songListContainer) return;

    // Cek apakah kontainer khusus video sudah ada di bawah list, jika belum kita buat baru
    let inlineVideoContainer = document.getElementById("mizu-inline-video-container");
    if (!inlineVideoContainer) {
        inlineVideoContainer = document.createElement("div");
        inlineVideoContainer.id = "mizu-inline-video-container";
        // Beri margin atas agar ada jarak manis dari daftar lagu di atasnya
        inlineVideoContainer.style = "margin-top: 25px; width: 100%; display: flex; flex-direction: column; align-items: center; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 20px;";
        songListContainer.after(inlineVideoContainer);
    }
    
    // Tampilkan animasi loading mizu di tempat lokasi video akan muncul
    inlineVideoContainer.innerHTML = `
        <div id="video-loader" style="text-align: center; padding: 15px 0;">
            <div style="font-weight: bold; font-size: 0.8rem; color: #BC002D; letter-spacing: 0.5px;">🎬 MIZU VIDEO ENGINE</div>
            <div style="font-size: 0.7rem; opacity: 0.6; font-style: italic; margin-top: 3px;">Preparing inline stream ticket...</div>
        </div>
    `;

    // Simpan id dan judul ke elemen kontainer agar fungsi ganti resolusi bisa membaca data terupdate
    inlineVideoContainer.setAttribute("data-active-id", videoId);
    inlineVideoContainer.setAttribute("data-active-title", title);

    // Muat default awal ke kualitas jernih cepat (360p)
    loadInlineResolution("360");
}

// Fungsi penarik stream data biner video dari server Zenzxz ke player menetap
async function loadInlineResolution(resolution) {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    if (!inlineContainer) return;

    const videoId = inlineContainer.getAttribute("data-active-id");
    const title = inlineContainer.getAttribute("data-active-title");

    try {
        // Ambil data resolusi biner angka murni sesuai parameter Bot WA kamu
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const apiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(videoUrl)}&format=${resolution}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API returned status ${response.status}`);
        
        const data = await response.json();

        // Skema pengecekan parameter link video multi-key dari respons server
        let finalVideoUrl = 
            data?.result?.download || 
            data?.result?.url || 
            data?.downloadUrl || 
            data?.url || 
            data?.result?.video;

        if (!finalVideoUrl) throw new Error("Link stream has not found.");

        // Catat timestamp durasi terakhir agar saat ganti resolusi tidak kembali ke detik 0
        const oldVideo = document.getElementById("mizu-inline-video-element");
        let lastTimestamp = 0;
        let isPlaying = true;
        if (oldVideo) {
            lastTimestamp = oldVideo.currentTime;
            isPlaying = !oldVideo.paused;
        }

        // Cetak struktur Video Player Menetap Premium
        inlineContainer.innerHTML = `
            <div style="font-size: 0.75rem; font-weight: bold; color: #333; text-align: center; margin-bottom: 12px; width: 100%; max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px;">
                 Playing Video: <span style="font-weight: 500; color: #666;">${title}</span>
            </div>

            <div style="position: relative; width: 100%; max-width: 450px;">
                <video id="mizu-inline-video-element" controls preload="auto" style="width: 100%; border-radius: 12px; background: #000; box-shadow: 0 4px 15px rgba(0,0,0,0.08); outline: none; display: block;"></video>
                <div onclick="closeInlineVideoPlayer()" style="position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; background: #333; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.2); user-select: none; -webkit-tap-highlight-color: transparent;">×</div>
            </div>
            
            <div style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;">
                <label style="color: #999; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Mizu Quality Selector</label>
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

        // Suntikkan URL stream langsung ke element video
        const videoElement = document.getElementById("mizu-inline-video-element");
        videoElement.src = finalVideoUrl;
        
        // Perintahkan web memproses pemuatan range byte stream parsial murni frontend
        videoElement.load();
        
        // Kembalikan posisi track durasi agar tidak mengulang dari 0 saat ganti resolusi
        videoElement.currentTime = lastTimestamp;

        // Tandai warna tombol resolusi aktif yang dipilih
        document.querySelectorAll(".inline-res-btn").forEach(btn => {
            if (btn.getAttribute("data-res") === resolution) {
                btn.classList.add("active-inline-res");
            }
        });

        // Gulirkan layar user secara halus agar langsung fokus tertuju ke area video yang baru muncul
        inlineContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });

        if (isPlaying) {
            await videoElement.play().catch(e => console.log("Autoplay blocked:", e));
        }

    } catch (err) {
        console.error("Mizu Inline Video Error:", err);
        inlineContainer.innerHTML = `
            <div style="text-align: center; padding: 15px; background: #fff; border-radius: 12px; border: 1px dashed rgba(188,0,45,0.2); max-width: 350px;">
                <div style="color: #BC002D; font-weight: bold; font-size: 0.8rem; margin-bottom: 4px;">QUALITY UNAVAILABLE</div>
                <div style="opacity: 0.6; font-size: 0.7rem; line-height: 1.4; margin-bottom: 12px;">Resolusi ${resolution}p gagal dimuat karena limitasi server API. Coba resolusi standar.</div>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button onclick="loadInlineResolution('360')" style="background: #333; color: white; border: none; padding: 6px 12px; border-radius: 15px; font-size: 0.7rem; font-weight: bold; cursor: pointer;">Gunakan 360p</button>
                    <button onclick="closeInlineVideoPlayer()" style="background: #f1f1f1; color: #333; border: none; padding: 6px 12px; border-radius: 15px; font-size: 0.7rem; font-weight: bold; cursor: pointer;">Tutup</button>
                </div>
            </div>
        `;
    }
}

// Fungsi pembongkar player video jika user menekan tombol silang bulat kecil
function closeInlineVideoPlayer() {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    const videoElement = document.getElementById("mizu-inline-video-element");
    if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
    }
    if (inlineContainer) {
        inlineContainer.remove(); // Bersihkan element secara total dari DOM pohon HTML
    }
            }
        
