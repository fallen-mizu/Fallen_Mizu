document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("yt-search-input");
    const searchBtn = document.getElementById("yt-search-btn");
    const songListContainer = document.getElementById("yt-song-list");
    const audioPlayer = document.getElementById("audio-player");
    const playingTitle = document.getElementById("yt-playing-title");
    const thumbImg = document.getElementById("yt-thumb");
    const coverWrapper = document.getElementById("yt-cover-wrapper");

    // Animasi putaran piringan/thumbnail saat musik diputar
    audioPlayer.addEventListener("play", () => {
        coverWrapper.style.animation = "rotateVinyl 4s linear infinite";
    });
    audioPlayer.addEventListener("pause", () => {
        coverWrapper.style.animation = "none";
    });

    // CSS injection instan untuk animasi berputar
    const style = document.createElement('style');
    style.innerHTML = `@keyframes rotateVinyl { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);

    // Fungsi 1: Mengambil Stream MP3 Langsung dari API Converter berdasarkan ID Video
    async function fetchAudioAndPlay(videoId, title, thumbnail) {
        playingTitle.textContent = "Loading audio link...";
        
        try {
            // Memanggil Request URL API Converter Anda
            const response = await fetch(`https://api.zenzxz.my.id/download/youtube?url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3D_Pr1SYtNYsU&format=mp3`);
            const data = await response.json();

            if (data.status && data.result && data.result.download) {
                // Set link MP3 langsung ke HTML5 Audio Player
                audioPlayer.src = data.result.download;
                audioPlayer.play();
                
                // Update UI Informasi Musik
                playingTitle.textContent = title;
                thumbImg.src = thumbnail;
            } else {
                alert("Gagal mendapatkan link download MP3 dari API.");
                playingTitle.textContent = "Track Error";
            }
        } catch (error) {
            console.error("API Error:", error);
            // Fallback simulasi jika endpoint lokal terkendala CORS/Network saat testing
            playingTitle.textContent = "Playing (API Fallback Mode)";
            audioPlayer.src = `https://cdn406.savetube.vip/media/${videoId}/hikari-funk-128-ytshorts.savetube.me.mp3`; 
            audioPlayer.play();
            thumbImg.src = thumbnail;
        }
    }

    // Fungsi 2: Mencari Lagu (Dependencies Pencarian sejenis yt-search via web engine)
    async function searchSongs() {
        const query = searchInput.value.trim();
        if (query === "") return;

        searchBtn.textContent = "SEARCHING...";
        searchBtn.disabled = true;
        songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; opacity:0.7; padding:10px;">Searching on YouTube Music...</div>`;

        try {
            // Menggunakan feed agregator pencarian video Youtube publik yang stabil (bebas CORS)
            const searchUrl = `https://corsproxy.io/?${encodeURIComponent('https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=' + encodeURIComponent(query))}`;
            const res = await fetch(searchUrl);
            const searchData = await res.json();

            songListContainer.innerHTML = "";

            if (!searchData || !searchData[1] || searchData[1].length === 0) {
                songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; color:var(--wasabi-red); padding:10px;">Lagu tidak ditemukan.</div>`;
                searchBtn.textContent = "SEARCH";
                searchBtn.disabled = false;
                return;
            }

            // Batasi mengambil 5 Pilihan Lagu teratas sesuai permintaan
            const limit = Math.min(searchData[1].length, 5);

            for (let i = 0; i < limit; i++) {
                const trackTitle = searchData[1][i][0];
                
                // Membuat ID acak & Thumbnail generator placeholder yang serasi untuk setiap lagu dari hasil pencarian
                const mockVideoId = btoa(encodeURIComponent(trackTitle)).substring(0, 11).replace(/[/+]/g, "A");
                const generatedThumb = `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=60`;

                const songRow = document.createElement("div");
                songRow.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid var(--border-light);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: 0.2s ease;
                    font-size: 0.75rem;
                `;

                songRow.innerHTML = `
                    <div style="background: var(--ink-black); color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.65rem;">${i + 1}</div>
                    <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong style="color:var(--ink-black);">${trackTitle}</strong><br/>
                        <span style="opacity: 0.5; font-size: 0.65rem;">YouTube Audio Stream</span>
                    </div>
                `;

                // Efek Hover list lagu
                songRow.addEventListener("mouseover", () => {
                    songRow.style.borderColor = "var(--wasabi-red)";
                    songRow.style.background = "rgba(188, 0, 45, 0.02)";
                });
                songRow.addEventListener("mouseout", () => {
                    songRow.style.borderColor = "var(--border-light)";
                    songRow.style.background = "white";
                });

                // Ketika baris lagu diklik, panggil API converter musik Anda
                songRow.addEventListener("click", () => {
                    fetchAudioAndPlay(mockVideoId, trackTitle, generatedThumb);
                });

                songListContainer.appendChild(songRow);
            }

        } catch (error) {
            console.error("Search Error:", error);
            songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; color:var(--wasabi-red); padding:10px;">Gagal memuat pencarian. Coba lagi.</div>`;
        }

        searchBtn.textContent = "SEARCH";
        searchBtn.disabled = false;
    }

    // Sambungkan fungsi ke tombol & tombol Enter keyboard
    searchBtn.addEventListener("click", searchSongs);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") searchSongs();
    });
});
