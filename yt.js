// =================================================================
// 0. VARIABEL GLOBAL (UNTUK ANTREAN & AUTOMATION)
// =================================================================
let currentTracksList = []; // Menyimpan daftar lagu hasil pencarian aktif
let currentTrackIndex = -1; // Menyimpan index lagu yang sedang diputar
let isLoopSingle = false;   // false = Autoplay Next, true = Looping 1 lagu saja

// =================================================================
// 1. FUNGSI UNTUK MENCARI LAGU (Dengan Tampilan Views & Efek Klik)
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

        // Bersihkan kontainer dan rekam daftar lagu aktif ke antrean global
        songListContainer.innerHTML = "";
        currentTracksList = data.results; 

        data.results.forEach((song, i) => {
            const songRow = document.createElement("div");
            songRow.className = "song-row"; // Class untuk animasi CSS klik
            
            // Format tampilan views jika ada dari API
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

            // Efek feedback visual instan saat baris lagu ditekan/diklik
            songRow.addEventListener("click", () => {
                currentTrackIndex = i; // Rekam indeks lagu yang sedang aktif
                
                // Hapus status aktif dari baris lain terlebih dahulu
                document.querySelectorAll(".song-row").forEach(el => el.classList.remove("active-track"));
                // Tambahkan efek aktif ke baris yang sedang diklik
                songRow.classList.add("active-track");
                
                playAudioTrack(song.id, song.title, song.thumbnail);
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
// 2. FUNGSI UNTUK MEMUTAR AUDIO (Bypass Cloudflare & Mendukung Seek)
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

        // Reset player untuk membersihkan sisa buffer lagu sebelumnya
        audioPlayer.pause();
        audioPlayer.src = finalMp3Url;
        
        // Memaksa browser meminta data stream parsial agar seek bar bisa bebas digeser kapan saja
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
// 3. LOGIKA AUTOMATION (ENDED EVENT listener: LOOP ATAU AUTOPLAY)
// =================================================================
const audioPlayer = document.getElementById("audio-player");
if (audioPlayer) {
    audioPlayer.addEventListener("ended", async () => {
        if (isLoopSingle) {
            // Mode LOOP: Putar ulang dari detik 0
            audioPlayer.currentTime = 0;
            await audioPlayer.play();
        } else {
            // Mode NEXT: Cek antrean list lagu selanjutnya
            if (currentTracksList.length > 0 && currentTrackIndex < currentTracksList.length - 1) {
                currentTrackIndex++; 
                const nextTrack = currentTracksList[currentTrackIndex];
                
                // Pindahkan kelas penanda aktif secara visual di list lagu
                document.querySelectorAll(".song-row").forEach((el, idx) => {
                    if (idx === currentTrackIndex) {
                        el.classList.add("active-track");
                        el.scrollIntoView({ behavior: "smooth", block: "nearest" }); // Auto-scroll otomatis ke baris lagu baru
                    } else {
                        el.classList.remove("active-track");
                    }
                });

                // Jalankan lagu selanjutnya
                playAudioTrack(nextTrack.id, nextTrack.title, nextTrack.thumbnail);
            } else {
                document.getElementById("yt-playing-status").textContent = "FINISHED";
            }
        }
    });
}

// Fungsi pengubah status mode putar (Dipicu tombol HTML)
function togglePlayMode() {
    const loopBtn = document.getElementById("yt-loop-btn");
    const loopText = document.getElementById("yt-loop-text");
    
    isLoopSingle = !isLoopSingle;
    
    if (isLoopSingle) {
        loopBtn.style.opacity = "1";
        loopText.textContent = "LOOP";
        loopBtn.title = "Mode: Repeat Single Track";
    } else {
        loopBtn.style.opacity = "0.7";
        loopText.textContent = "NEXT";
        loopBtn.title = "Mode: Autoplay Next";
    }
}

// =================================================================
// 4. SHORTCUT KEYBOARD & KONTROL STANDAR (CLOSE & KEYPRESS)
// =================================================================
document.addEventListener("keydown", (e) => {
    const player = document.getElementById("audio-player");
    if (document.activeElement.id === "yt-search-input") return; // Jangan jalankan jika sedang mengetik cari lagu
    
    if (player && player.src) {
        if (e.key === "ArrowRight") {
            e.preventDefault();
            player.currentTime = Math.min(player.duration, player.currentTime + 10); // Maju 10 detik
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            player.currentTime = Math.max(0, player.currentTime - 10); // Mundur 10 detik
        }
    }
});

function closeAudioPlayer() {
    const playerBar = document.getElementById("spotify-player-bar");
    const player = document.getElementById("audio-player");
    if (player) {
        player.pause();
        player.src = "";
    }
    if (playerBar) playerBar.style.display = "none";
}

// Event Bindings ke element HTML standar
document.getElementById("yt-search-btn").addEventListener("click", searchSongs);
document.getElementById("yt-search-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchSongs();
});
  
