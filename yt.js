document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("yt-search-input");
    const searchBtn = document.getElementById("yt-search-btn");
    const songListContainer = document.getElementById("yt-song-list");
    const audioPlayer = document.getElementById("audio-player");
    const playingTitle = document.getElementById("yt-playing-title");
    const thumbImg = document.getElementById("yt-thumb");

    // ================= CONFIG URL SERVER =================
    // 1. URL PENCARIAN (Kembali menembak ke API Search Vercel Anda yang lama)
    const SEARCH_API_URL = "/api/search"; 

    // 2. URL PROXY AUDIO (Murni menembak ke Cloudflare Worker Anda)
    // PENTING: Ganti tulisan di bawah ini dengan URL Worker Anda yang asli!
    const WORKER_DOWNLOAD_URL = "https://mizu-audio-proxy.tohsakarin756.workers.dev"; 
    // =====================================================

    // Fungsi memutar musik menggunakan Cloudflare Worker Stream
    async function playAudioTrack(videoId, title, thumbnail) {
    playingTitle.textContent = "Mengunduh komponen audio ke memori...";
    
    // RESET & BERSIHKAN BEKAS LAGU LAMA DARI BUFFER HP
    audioPlayer.pause();
    const oldSrc = audioPlayer.src;
    if (oldSrc && oldSrc.startsWith('blob:')) {
        URL.revokeObjectURL(oldSrc); // Hancurkan object URL lama agar hemat RAM
    }
    audioPlayer.removeAttribute('src');
    audioPlayer.load(); 
    console.log("Memori cache lagu lama berhasil dimusnahkan.");

    try {
        // 1. Ambil data biner audio dari Cloudflare Worker secara utuh
        const targetUrl = `${WORKER_DOWNLOAD_URL}?id=${videoId}`;
        const response = await fetch(targetUrl);
        
        if (!response.ok) throw new Error("Gagal mengambil file dari Worker.");

        const audioBlob = await response.blob();
        
        // 2. Ubah biner mp3 menjadi URL lokal internal browser Anda
        const localObjectURL = URL.createObjectURL(audioBlob);
        
        // 3. Masukkan ke player. Durasi otomatis terisi penuh dan akurat!
        audioPlayer.src = localObjectURL;
        audioPlayer.load(); 

        // Perbarui Informasi Tampilan Lagu di Layout
        playingTitle.textContent = title;
        thumbImg.src = thumbnail;

        // 4. Perintah Putar Lagu
        audioPlayer.play()
            .then(() => {
                playingTitle.textContent = title;
            })
            .catch(e => {
                // Dipicu jika dicegat oleh Autoplay Policy Chrome Android
                // Tombol PLAY segitiga dijamin sudah menyala HITAM tegas dan durasi tidak lagi 0:00!
                playingTitle.textContent = "🎵 " + title + " (Klik Tombol PLAY)";
                console.log("Autoplay ditahan, tombol manual aktif.");
            });

    } catch (error) {
        console.error("Kesalahan Player:", error);
        playingTitle.textContent = "Gagal memuat lagu. Coba klik ulang baris lagu.";
    }
    }

    // Fungsi melakukan pencarian 5 lagu teratas menembak ke api/search.js Vercel
    async function searchSongs() {
        const query = searchInput.value.trim();
        if (query === "") return;

        searchBtn.textContent = "MENCARI...";
        searchBtn.disabled = true;
        songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; opacity:0.7; padding:10px;">Mencari trek via yt-search Vercel...</div>`;

        try {
            // Menembak kembali ke backend Vercel search.js
            const res = await fetch(`${SEARCH_API_URL}?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            songListContainer.innerHTML = "";

            if (!data.status || !data.results || data.results.length === 0) {
                songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; color:red; padding:10px;">Lagu tidak ditemukan atau API Search bermasalah.</div>`;
                return;
            }

            // Tampilkan daftar 5 lagu hasil pencarian Vercel
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

                // Ketika baris lagu diklik, panggil fungsi play audio via Cloudflare Worker
                songRow.addEventListener("click", () => {
                    playAudioTrack(song.id, song.title, song.thumbnail);
                });

                songListContainer.appendChild(songRow);
            });

        } catch (error) {
            console.error("Search Fetch Error:", error);
            songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; color:red; padding:10px;">Gagal terhubung ke Fungsi Search Vercel.</div>`;
        } finally {
            searchBtn.textContent = "SEARCH";
            searchBtn.disabled = false;
        }
    }

    // Event Listener untuk tombol dan keyboard enter
    searchBtn.addEventListener("click", searchSongs);
    searchInput.addEventListener("keypress", (e) => { 
        if (e.key === "Enter") searchSongs(); 
    });
});
        
