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

// 2. FUNGSI UNTUK MEMUTAR AUDIO (VERSI FIX BYPASS REDIRECT ANDROID)
async function playAudioTrack(videoId, title, thumbnail) {
    // Tampilkan bar Spotify melayang yang ada di bagian bawah HTML
    const playerBar = document.getElementById("spotify-player-bar");
    if (playerBar) playerBar.style.display = "flex";

    // Set Judul dan Status Lagu
    document.getElementById("yt-playing-title").textContent = title;
    document.getElementById("yt-playing-status").textContent = "LOADING..."; // Ubah ke LOADING dulu
    
    // Ganti gambar thumbnail kotak Spotify
    const thumbImg = document.getElementById("yt-thumb");
    if (thumbImg) {
        thumbImg.src = thumbnail;
        thumbImg.style.display = "block";
    }

    const audioPlayer = document.getElementById("audio-player");
    
    try {
        const workerUrl = `https://mizu-audio-proxy.tohsakarin756.workers.dev/?id=${videoId}`;
        
        // 🔥 TRIK UTAMA: Ambil response pembungkus untuk memecah Redirect 302
        const response = await fetch(workerUrl);
        
        // Ambil URL final setelah dialihkan otomatis oleh Cloudflare
        const finalAudioUrl = response.url; 

        // Set source audio ke URL asli yang sudah matang
        audioPlayer.src = finalAudioUrl; 
        audioPlayer.load(); // Kosongkan antrean memori pemutar lama
        
        // Ubah status menjadi PLAYING kembali
        document.getElementById("yt-playing-status").textContent = "PLAYING";

        // Mainkan audionya
        await audioPlayer.play();

    } catch (err) {
        console.error("Gagal memutar audio:", err);
        document.getElementById("yt-playing-status").textContent = "ERROR CODE";
    }
}
