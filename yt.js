// =================================================================
// 1. FUNGSI UNTUK MENCARI LAGU (Tetap Terhubung ke /api/search Vercel)
// =================================================================
async function searchSongs() {
    const query = document.getElementById("yt-search-input").value;
    const songListContainer = document.getElementById("yt-song-list");
    
    if (!query) return;
    songListContainer.innerHTML = `<div style="text-align:center; font-size:0.8rem; opacity:0.5;">Searching...</div>`;

    try {
        // Memanggil API search.js asli bawaan Vercel Anda
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!data.status || data.results.length === 0) {
            songListContainer.innerHTML = `<div style="text-align:center; font-size:0.8rem; opacity:0.5;">Music not found.</div>`;
            return;
        }

        // Bersihkan kontainer hasil pencarian lama
        songListContainer.innerHTML = "";

        // Tampilkan daftar hasil pencarian (Maksimal 5 lagu)
        data.results.forEach((song, i) => {
            const songRow = document.createElement("div");
            songRow.style.display = "flex";
            songRow.style.alignItems = "center";
            songRow.style.justifyContent = "space-between";
            songRow.style.padding = "10px";
            songRow.style.background = "white";
            songRow.style.borderRadius = "10px";
            songRow.style.border = "1px solid rgba(0,0,0,0.05)";
            songRow.style.cursor = "pointer";
            songRow.style.transition = "0.2s";

            songRow.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                    <span style="font-weight: bold; font-size: 0.8rem; opacity: 0.5; width: 20px; text-align: center;">${i + 1}</span>
                    <div style="min-width: 0;">
                        <div style="font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.title}</div>
                        <div style="font-size: 0.65rem; opacity: 0.6;">${song.author}</div>
                    </div>
                </div>
                <span style="font-size: 0.7rem; opacity: 0.5; flex-shrink: 0;">${song.duration}</span>
            `;

            // Saat baris lagu diklik, panggil fungsi pemutar audio
            songRow.addEventListener("click", () => {
                playAudioTrack(song.id, song.title, song.thumbnail);
            });

            songListContainer.appendChild(songRow);
        });

    } catch (error) {
        songListContainer.innerHTML = `<div style="text-align:center; font-size:0.8rem; color:red;">Error: ${error.message}</div>`;
    }
}

// =================================================================
// 2. FUNGSI UNTUK MEMUTAR AUDIO (BYPASS CLOUDFLARE - LANGSUNG KE API)
// =================================================================
async function playAudioTrack(videoId, title, thumbnail) {
    // Tampilkan bar Spotify melayang di bawah
    const playerBar = document.getElementById("spotify-player-bar");
    if (playerBar) playerBar.style.display = "flex";

    // Set judul lagu dan ubah status sementara menjadi LOADING
    document.getElementById("yt-playing-title").textContent = title;
    document.getElementById("yt-playing-status").textContent = "LOADING...";
    
    const thumbImg = document.getElementById("yt-thumb");
    if (thumbImg) {
        thumbImg.src = thumbnail;
        thumbImg.style.display = "block";
    }

    const audioPlayer = document.getElementById("audio-player");
    
    try {
        // 🔥 KUNCI UTAMA: Rekonstruksi URL YouTube langsung menggunakan standard template literal
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // 🔥 BYPASS CLOUDFLARE: Langsung tembak API Zenzxz dari Frontend Vercel kamu
        const apiUrl = `https://api.zenzxz.my.id/download/youtube?url=${encodeURIComponent(videoUrl)}&format=mp3`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Ambil data sesuai dengan struktur JSON asli Zenzxz (data.result.download)
        if (!data.status || !data.result || !data.result.download) {
            throw new Error("Gagal mengambil link download dari Zenzxz.");
        }

        const finalMp3Url = data.result.download;

        // Suapi elemen audio dengan link direct MP3 dari Savetube
        audioPlayer.src = finalMp3Url;
        audioPlayer.load(); // Bersihkan sisa buffer lagu sebelumnya
        
        // Kembalikan status teks ke PLAYING
        document.getElementById("yt-playing-status").textContent = "PLAYING";

        // Eksekusi putar musiknya
        await audioPlayer.play();

    } catch (err) {
        console.error("Mizu Player Error:", err);
        document.getElementById("yt-playing-status").textContent = "SERVER BUSY";
        alert("Duh, server pengekstraksinya lagi sibuk, coba lagu yang lain dulu ya! 😤");
    }
}

// =================================================================
// 3. EVENT LISTENER TOMBOL SEARCH & ENTER DI KEYBOARD
// =================================================================
document.getElementById("yt-search-btn").addEventListener("click", searchSongs);
document.getElementById("yt-search-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchSongs();
});

// =================================================================
// 4. FUNGSI TOMBOL SILANG (CLOSE PLAYER BAR)
// =================================================================
function closeAudioPlayer() {
    const playerBar = document.getElementById("spotify-player-bar");
    const audioPlayer = document.getElementById("audio-player");
    
    if (audioPlayer) {
        audioPlayer.pause();       // Hentikan musik yang sedang berputar
        audioPlayer.src = "";      // Kosongkan sumber audio agar memori bersih
    }
    
    if (playerBar) {
        playerBar.style.display = "none"; // Sembunyikan bar dari layar
    }
          }
  
