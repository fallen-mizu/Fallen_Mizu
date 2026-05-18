// 1. FUNGSI UNTUK MENCARI LAGU (Terhubung ke search.js di Vercel)
async function searchSongs() {
    const query = document.getElementById("yt-search-input").value;
    const songListContainer = document.getElementById("yt-song-list");
    
    if (!query) return;
    songListContainer.innerHTML = `<div style="text-align:center; font-size:0.8rem; opacity:0.5;">Searching...</div>`;

    try {
        // Memanggil API search.js milik Anda
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!data.status || data.results.length === 0) {
            songListContainer.innerHTML = `<div style="text-align:center; font-size:0.8rem; opacity:0.5;">Music not found.</div>`;
            return;
        }

        // Bersihkan kontainer sebelum menampilkan hasil baru
        songListContainer.innerHTML = "";

        // Tampilkan 5 lagu teratas
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

            // 🔥 DI SINI LETAK PEMICUNYA: Saat baris lagu diklik, panggil fungsi playAudioTrack
            songRow.addEventListener("click", () => {
                playAudioTrack(song.id, song.title, song.thumbnail);
            });

            songListContainer.appendChild(songRow);
        });

    } catch (error) {
        songListContainer.innerHTML = `<div style="text-align:center; font-size:0.8rem; color:red;">Error: ${error.message}</div>`;
    }
}

// 2. FUNGSI UNTUK MEMUTAR AUDIO (Letakkan kode yang Anda tanyakan di bawah ini)
function playAudioTrack(videoId, title, thumbnail) {
    // Tampilkan bar Spotify melayang yang ada di bagian bawah HTML
    const playerBar = document.getElementById("spotify-player-bar");
    if (playerBar) playerBar.style.display = "flex";

    // Set Judul dan Status Lagu
    document.getElementById("yt-playing-title").textContent = title;
    document.getElementById("yt-playing-status").textContent = "PLAYING";
    
    // Ganti gambar thumbnail kotak Spotify dengan thumbnail asli lagu tersebut
    const thumbImg = document.getElementById("yt-thumb");
    if (thumbImg) {
        thumbImg.src = thumbnail;
        thumbImg.style.display = "block";
    }

    // Sambungkan ke Cloudflare Worker Anda untuk streaming mpeg bypass Android 0:00
    const audioPlayer = document.getElementById("audio-player");
    
    // ⚠️ GANTI URL DI BAWAH INI DENGAN URL WORKER CLOUDFLARE MILIK ANDA SENDIRI
    audioPlayer.src = `https://mizu-audio-proxy.tohsakarin756.workers.dev/?id=${videoId}`; 
    audioPlayer.load(); // Paksa browser menghapus cache lagu sebelumnya dari memori HP
    
    audioPlayer.play().catch(err => console.log("Autoplay dicegah browser: ", err));
}

// 3. EVENT LISTENER TOMBOL SEARCH HTML
document.getElementById("yt-search-btn").addEventListener("click", searchSongs);
document.getElementById("yt-search-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchSongs();
});

// Fungsi untuk menutup player bar dan menghentikan audio
function closeAudioPlayer() {
    const playerBar = document.getElementById("spotify-player-bar");
    const audioPlayer = document.getElementById("audio-player");
    
    if (audioPlayer) {
        audioPlayer.pause();       // Hentikan musik yang sedang berputar
        audioPlayer.src = "";      // Kosongkan source audio agar memori bersih
    }
    
    if (playerBar) {
        playerBar.style.display = "none"; // Sembunyikan bar dari layar
    }
}

