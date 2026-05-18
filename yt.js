document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("yt-search-input");
    const searchBtn = document.getElementById("yt-search-btn");
    const songListContainer = document.getElementById("yt-song-list");
    const iframeContainer = document.getElementById("audio-iframe-container");
    const playingTitle = document.getElementById("yt-playing-title");
    const playingStatus = document.getElementById("yt-playing-status");
    const vinyl = document.getElementById("yt-vinyl");

    // Animasi putaran piringan hitam
    let rotationInterval;
    let currentRotation = 0;

    function startVinylAnimation() {
        clearInterval(rotationInterval);
        rotationInterval = setInterval(() => {
            currentRotation += 2;
            vinyl.style.transform = `rotate(${currentRotation}deg)`;
        }, 30);
    }

    function stopVinylAnimation() {
        clearInterval(rotationInterval);
    }

    // Fungsi untuk memutar audio berdasarkan ID video YouTube
    window.playAudioTrack = function(videoId, title) {
        // Hapus player lama jika ada
        iframeContainer.innerHTML = "";

        // Buat elemen iframe baru dengan opsi autoplay
        const iframe = document.createElement("iframe");
        iframe.setAttribute("width", "100");
        iframe.setAttribute("height", "100");
        iframe.setAttribute("src", `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&controls=0&rel=0`);
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
        
        iframeContainer.appendChild(iframe);

        // Update UI status pemutar audio
        playingTitle.textContent = title;
        playingStatus.textContent = "NOW PLAYING";
        startVinylAnimation();
    };

    // Fungsi untuk mencari lagu dan mengekstrak 5 video teratas tanpa API resmi
    async function searchSongs() {
        const query = searchInput.value.trim();
        if (query === "") return;

        searchBtn.textContent = "LOADING...";
        searchBtn.disabled = true;
        songListContainer.innerHTML = `<div style="font-size:0.75rem; text-align:center; opacity:0.7; padding:10px;">Searching track online...</div>`;

        try {
            // Memanfaatkan proksi CORS publik dan RSS Feed pencarian YouTube untuk mendapatkan hasil real-time gratis
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://www.youtube.com/feeds/videos.xml?search_query=' + encodeURIComponent(query + " audio"))}`);
            const data = await response.json();
            
            // Parsing data XML menjadi objek bacaan
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data.contents, "text/xml");
            const entries = xmlDoc.getElementsByTagName("entry");

            songListContainer.innerHTML = "";

            if (entries.length === 0) {
                songListContainer.innerHTML = `<div style="font-size:0.75rem; color:var(--wasabi-red); text-align:center; padding:10px;">Lagu tidak ditemukan. Silakan ganti keyword.</div>`;
                searchBtn.textContent = "SEARCH";
                searchBtn.disabled = false;
                return;
            }

            // Batasi maksimal mengambil 5 lagu teratas
            const limit = Math.min(entries.length, 5);

            for (let i = 0; i < limit; i++) {
                const entry = entries[i];
                const title = entry.getElementsByTagName("title")[0].textContent;
                const videoId = entry.getElementsByTagName("yt:videoId")[0].textContent;
                const author = entry.getElementsByTagName("author")[0].getElementsByTagName("name")[0].textContent;

                // Membuat elemen card tombol baris lagu
                const songRow = document.createElement("div");
                songRow.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid var(--border-light);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: 0.2s ease;
                    font-size: 0.75rem;
                `;

                songRow.innerHTML = `
                    <div style="background: var(--ink-black); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.65rem;">${i + 1}</div>
                    <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong style="color:var(--ink-black);">${title}</strong> <br/>
                        <span style="opacity: 0.6; font-size: 0.65rem;">${author}</span>
                    </div>
                `;

                // Hover effect
                songRow.addEventListener("mouseover", () => {
                    songRow.style.borderColor = "var(--wasabi-red)";
                    songRow.style.background = "rgba(188, 0, 45, 0.02)";
                });
                songRow.addEventListener("mouseout", () => {
                    songRow.style.borderColor = "var(--border-light)";
                    songRow.style.background = "white";
                });

                // Klik Event untuk memutar musik
                songRow.addEventListener("click", () => {
                    window.playAudioTrack(videoId, title);
                });

                songListContainer.appendChild(songRow);
            }

        } catch (error) {
            console.error(error);
            songListContainer.innerHTML = `<div style="font-size:0.75rem; color:var(--wasabi-red); text-align:center; padding:10px;">Gagal mengambil data (Masalah Jaringan/CORS). Coba lagi.</div>`;
        }

        searchBtn.textContent = "SEARCH";
        searchBtn.disabled = false;
    }

    // Event Listener Tombol Pencarian
    searchBtn.addEventListener("click", searchSongs);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") searchSongs();
    });
});
