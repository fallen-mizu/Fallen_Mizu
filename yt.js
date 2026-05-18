document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("yt-search-input");
    const searchBtn = document.getElementById("yt-search-btn");
    const songListContainer = document.getElementById("yt-song-list");
    const audioPlayer = document.getElementById("audio-player");
    const playingTitle = document.getElementById("yt-playing-title");
    const thumbImg = document.getElementById("yt-thumb");

    // Variabel global di luar fungsi untuk mencatat object URL yang sedang aktif di memori browser
let currentAudioObjectURL = null;
    

    // Jalur dasar menuju serverless function Vercel milikmu
    const BASE_API_URL = "/api"; 

    // Fungsi memutar audio menggunakan sistem proxy mpeg ala bot WhatsApp
    async function playAudioTrack(videoId, title, thumbnail) {
    playingTitle.textContent = "Menghubungkan ke Cloudflare Worker Proxy...";
    
    // OTOMATIS MENGHAPUS & MERESET BEKAS LAGU LAMA DARI MEMORI BROWSER
    audioPlayer.pause();
    audioPlayer.removeAttribute('src');
    audioPlayer.load(); 
    console.log("Buffer lagu lama dibersihkan dari memori browser.");

    // LANGSUNG ARAHKAN SRC KE WORKER
    // Karena Worker memuntahkan stream audio/mpeg secara realtime,
    // elemen <audio> HTML5 akan langsung membaca durasi aslinya secara instan!
    const directWorkerStream = `${WORKER_URL}?id=${videoId}`;
    
    audioPlayer.src = directWorkerStream;
    audioPlayer.load(); // Paksa browser membaca ukuran stream audio

    // Update UI Tampilan Informasi Lagu
    playingTitle.textContent = "🎵 " + title;
    thumbImg.src = thumbnail;

    // Jalankan perintah putar
    audioPlayer.play()
        .then(() => {
            playingTitle.textContent = title;
        })
        .catch(e => {
            // Jika autoplay diblokir oleh Android/Chrome (Kebijakan sistem)
            // Di sini tombol PLAY (segitiga) dipastikan sudah AKTIF (berwarna hitam pekat)
            playingTitle.textContent = "🎵 " + title + " (Klik Tombol PLAY)";
            console.log("Autoplay ditahan, tombol play manual mpeg aktif.");
        });
    }
    

    // Fungsi melakukan pencarian 5 lagu teratas memanfaatkan yt-search di backend
    async function searchSongs() {
        const query = searchInput.value.trim();
        if (query === "") return;

        searchBtn.textContent = "MENCARI...";
        searchBtn.disabled = true;
        songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; opacity:0.7; padding:10px;">Mencari trek via yt-search...</div>`;

        try {
            const res = await fetch(`${BASE_API_URL}/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            songListContainer.innerHTML = "";

            if (!data.status || !data.results || data.results.length === 0) {
                songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; color:red; padding:10px;">Lagu tidak ditemukan atau API Error.</div>`;
                return;
            }

            // Tampilkan tepat 5 pilihan lagu teratas
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

                // Ketika salah satu dari 5 lagu diklik, panggil fungsi play proxy mpeg
                songRow.addEventListener("click", () => {
                    playAudioTrack(song.id, song.title, song.thumbnail);
                });

                songListContainer.appendChild(songRow);
            });

        } catch (error) {
            console.error("Search Fetch Error:", error);
            songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; color:red; padding:10px;">Gagal terhubung ke Fungsi Vercel.</div>`;
        } finally {
            searchBtn.textContent = "SEARCH";
            searchBtn.disabled = false;
        }
    }

    searchBtn.addEventListener("click", searchSongs);
    searchInput.addEventListener("keypress", (e) => { 
        if (e.key === "Enter") searchSongs(); 
    });
});
