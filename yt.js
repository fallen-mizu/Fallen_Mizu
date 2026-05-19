// =================================================================
// 1. FUNGSI UNTUK MENCARI LAGU (Dengan Penambahan Info Views & Efek Klik)
// =================================================================
async function searchSongs() {
    const query = document.getElementById("yt-search-input").value;
    const songListContainer = document.getElementById("yt-song-list");
    
    if (!query) return;
    songListContainer.innerHTML = `<div style="text-align:center; font-size:0.8rem; opacity:0.5;">Searching...</div>`;

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!data.status || !data.results || data.results.length === 0) {
            songListContainer.innerHTML = `<div style="text-align:center; font-size:0.8rem; opacity:0.5;">Music not found.</div>`;
            return;
        }

        songListContainer.innerHTML = "";

        data.results.forEach((song, i) => {
            const songRow = document.createElement("div");
            // Menambahkan class untuk animasi CSS klik
            songRow.className = "song-row";
            
            // Format tampilan views jika ada dari API, jika tidak ada memakai fallback format rapi
            const viewCount = song.views ? formatViews(song.views) : "Premium Track";

            songRow.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                    <span style="font-weight: bold; font-size: 0.8rem; opacity: 0.5; width: 20px; text-align: center;">${i + 1}</span>
                    <div style="min-width: 0;">
                        <div style="font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #333;">${song.title}</div>
                        <div style="font-size: 0.65rem; opacity: 0.6; display: flex; gap: 8px; align-items: center; margin-top: 2px;">
                            <span>${song.author}</span>
                            <span style="opacity: 0.4;">•</span>
                            <span style="color: #666; font-weight: 500;">👁️ ${viewCount}</span>
                        </div>
                    </div>
                </div>
                <span style="font-size: 0.7rem; opacity: 0.5; flex-shrink: 0; font-weight: 600;">${song.duration}</span>
            `;

            // 🔥 INTEGRASI MODAL DIALOG PILIHAN MEDIA (AUDIO / VIDEO)
            songRow.addEventListener("click", () => {
                // Hapus status aktif dari baris lain terlebih dahulu
                document.querySelectorAll(".song-row").forEach(el => el.classList.remove("active-track"));
                // Tambahkan efek aktif ke baris yang sedang diklik
                songRow.classList.add("active-track");
                
                const currentAudio = document.getElementById("audio-player");
                
                // Buat atau panggil kontainer modal pilihan pop-up
                let optionModal = document.getElementById("mizu-option-modal");
                if (!optionModal) {
                    optionModal = document.createElement("div");
                    optionModal.id = "mizu-option-modal";
                    optionModal.style = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index: 10001; display: flex; align-items: center; justify-content: center; font-family: inherit;";
                    document.body.appendChild(optionModal);
                }
                optionModal.style.display = "flex";

                optionModal.innerHTML = `
                    <div style="background: white; padding: 25px; border-radius: 16px; width: 85%; max-width: 320px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
                        <div style="font-size: 0.85rem; font-weight: bold; color: #333; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.title}</div>
                        <div style="font-size: 0.7rem; color: #666; margin-bottom: 20px;">Select format resolution:</div>
                        
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button id="opt-audio-btn" style="flex: 1; background: #333; color: white; border: none; padding: 12px; border-radius: 25px; font-size: 0.75rem; font-weight: bold; cursor: pointer; -webkit-tap-highlight-color: transparent;">
                                 AUDIO
                            </button>
                            <button id="opt-video-btn" style="flex: 1; background: #BC002D; color: white; border: none; padding: 12px; border-radius: 25px; font-size: 0.75rem; font-weight: bold; cursor: pointer; -webkit-tap-highlight-color: transparent;">
                                 VIDEO
                            </button>
                        </div>
                        <div id="opt-cancel" style="margin-top: 15px; font-size: 0.7rem; color: #999; cursor: pointer; text-decoration: underline;">Cancel</div>
                    </div>
                `;

                // Event jika pengguna memilih AUDIO
                document.getElementById("opt-audio-btn").onclick = () => {
                    optionModal.style.display = "none";
                    // Tutup pemutar video melayang jika sebelumnya sedang terbuka
                    if (typeof closeVideoPlayer === "function") closeVideoPlayer(); 
                    playAudioTrack(song.id, song.title, song.thumbnail);
                };

                // Event jika pengguna memilih VIDEO
                document.getElementById("opt-video-btn").onclick = () => {
                    optionModal.style.display = "none";
                    // Hentikan pemutaran audio di bar bawah agar suaranya tidak tabrakan
                    if (currentAudio) currentAudio.pause(); 
                    // Panggil fungsi pemutar video utama dari video.js
                    if (typeof playVideoTrack === "function") {
                        playVideoTrack(song.id, song.title);
                    } else {
                        alert("Gagal memuat sistem pemutar video. Pastikan file video.js sudah diimpor di index.html!");
                    }
                };

                // Event jika memilih Batal
                document.getElementById("opt-cancel").onclick = () => {
                    optionModal.style.display = "none";
                    songRow.classList.remove("active-track");
                };
            });

            songListContainer.appendChild(songRow);
        });

    } catch (error) {
        songListContainer.innerHTML = `<div style="text-align:center; font-size:0.8rem; color:red;">Error: ${error.message}</div>`;
    }
}

// Helper untuk merapikan digit angka views (Contoh: 1500000 -> 1.5M views)
function formatViews(num) {
    if (typeof num === 'string') return num; 
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
}

// =================================================================
// 2. FUNGSI UNTUK MEMUTAR AUDIO (Optimasi Seek Durasi Bebas Geser)
// =================================================================
async function playAudioTrack(videoId, title, thumbnail) {
    const playerBar = document.getElementById("spotify-player-bar");
    if (playerBar) playerBar.style.display = "flex";

    document.getElementById("yt-playing-title").textContent = title;
    document.getElementById("yt-playing-status").textContent = "LOADING...";
    
    const thumbImg = document.getElementById("yt-thumb");
    if (thumbImg) {
        thumbImg.src = thumbnail;
        thumbImg.style.display = "block";
    }

    const audioPlayer = document.getElementById("audio-player");
    
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const apiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(videoUrl)}&format=mp3`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.status || !data.result || !data.result.download) {
            throw new Error("Gagal mengambil link download.");
        }

        const finalMp3Url = data.result.download;

        // Reset player untuk membersihkan cache lagu sebelumnya
        audioPlayer.pause();
        audioPlayer.src = finalMp3Url;
        
        // 🔥 KUNCI SEEKING DURASI: Paksa browser meminta data stream parsial (HTTP byte-range) 
        // agar user bisa langsung lompat ke detik/menit tengah manapun secara instan.
        audioPlayer.load(); 
        
        document.getElementById("yt-playing-status").textContent = "PLAYING";
        await audioPlayer.play();

    } catch (err) {
        console.error("Mizu Player Error:", err);
        document.getElementById("yt-playing-status").textContent = "SERVER BUSY";
        alert("Duh, server pengekstraksinya lagi sibuk, coba lagu yang lain dulu ya! 😤");
    }
}

// =================================================================
// 3. BIND EVENT LISTENER STANDAR
// =================================================================
document.getElementById("yt-search-btn").addEventListener("click", searchSongs);
document.getElementById("yt-search-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchSongs();
});

function closeAudioPlayer() {
    const playerBar = document.getElementById("spotify-player-bar");
    const audioPlayer = document.getElementById("audio-player");
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
    }
    if (playerBar) playerBar.style.display = "none";
}
