document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("yt-search-input");
    const searchBtn = document.getElementById("yt-search-btn");
    const songListContainer = document.getElementById("yt-song-list");
    const audioPlayer = document.getElementById("audio-player");
    const playingTitle = document.getElementById("yt-playing-title");
    const thumbImg = document.getElementById("yt-thumb");

    // KUNCI UTAMA VERCEL: Menggunakan path relatif tanpa host/domain
    const BASE_API_URL = "/api"; 

    // Fungsi memanggil API download MP3 dinamis berdasarkan lagu yang diklik
    async function playAudioTrack(videoId, title, thumbnail) {
        playingTitle.textContent = "Mengambil link audio .mp3...";
        audioPlayer.src = ""; // Bersihkan trek lama

        try {
            // Mengarah ke /api/download?id=...
            const response = await fetch(`${BASE_API_URL}/download?id=${videoId}`);
            const data = await response.json();

            if (data.status && data.result && data.result.download) {
                audioPlayer.src = data.result.download;
                audioPlayer.load();
                audioPlayer.play()
                    .then(() => {
                        playingTitle.textContent = title;
                        thumbImg.src = thumbnail;
                    })
                    .catch(e => {
                        playingTitle.textContent = "Gagal memutar otomatis (Klik tombol Play)";
                        console.error(e);
                    });
            } else {
                playingTitle.textContent = "Audio tidak tersedia pada API";
            }
        } catch (error) {
            console.error("Download Error:", error);
            playingTitle.textContent = "Gagal terhubung ke API Server";
        }
    }

    // Fungsi melakukan pencarian 5 lagu teratas ke backend node (yt-search)
    async function searchSongs() {
        const query = searchInput.value.trim();
        if (query === "") return;

        // Beri proteksi agar tombol berubah status saat loading
        searchBtn.textContent = "MENCARI...";
        searchBtn.disabled = true;
        songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; opacity:0.7; padding:10px;">Mencari trek via yt-search...</div>`;

        try {
            // Mengarah ke /api/search?q=...
            const res = await fetch(`${BASE_API_URL}/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            songListContainer.innerHTML = "";

            if (!data.status || !data.results || data.results.length === 0) {
                songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; color:red; padding:10px;">Lagu tidak ditemukan atau API Error.</div>`;
                // Kembalikan tombol ke kondisi semula jika gagal
                searchBtn.textContent = "SEARCH";
                searchBtn.disabled = false;
                return;
            }

            // Tampilkan tepat 5 pilihan lagu secara interaktif
            data.results.forEach((song, i) => {
                const songRow = document.createElement("div");
                songRow.style.cssText = "display:flex; align-items:center; gap:12px; padding:8px 12px; background:white; border:1px solid #ddd; border-radius:8px; cursor:pointer; margin-bottom:8px; font-size:0.75rem; transition: 0.2s;";
                
                songRow.innerHTML = `
                    <div style="background:#222; color:white; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-weight:bold;">${i + 1}</div>
                    <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        <strong>${song.title}</strong><br/>
                        <span style="opacity:0.6; font-size:0.65rem;">${song.author} — ${song.duration}</span>
                    </div>
                `;

                songRow.addEventListener("mouseover", () => songRow.style.borderColor = "red");
                songRow.addEventListener("mouseout", () => songRow.style.borderColor = "#ddd");

                // Saat salah satu dari 5 lagu diklik, putar audionya
                songRow.addEventListener("click", () => {
                    playAudioTrack(song.id, song.title, song.thumbnail);
                });

                songListContainer.appendChild(songRow);
            });

        } catch (error) {
            console.error("Search Fetch Error:", error);
            songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; color:red; padding:10px;">Gagal terhubung ke Fungsi Vercel.</div>`;
        } finally {
            // Blok finally memastikan tombol SELALU aktif kembali apa pun hasilnya
            searchBtn.textContent = "SEARCH";
            searchBtn.disabled = false;
        }
    }

    // Pasang event listener ke tombol
    searchBtn.addEventListener("click", searchSongs);
    searchInput.addEventListener("keypress", (e) => { 
        if (e.key === "Enter") searchSongs(); 
    });
});
                                 
