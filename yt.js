document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("yt-search-input");
    const searchBtn = document.getElementById("yt-search-btn");
    const player = document.getElementById("yt-player");

    // Fungsi utama untuk memproses lagu
    function playSong() {
        const query = searchInput.value.trim();
        if (query === "") return;

        // Menggunakan fitur pencarian dinamis YouTube Embed via URL parameter
        // 'autoplay=1' membuat lagu otomatis berputar setelah dicari
        const targetUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`;
        
        // Perbarui src iframe
        player.src = targetUrl;
    }

    // Eksekusi ketika tombol search di klik
    searchBtn.addEventListener("click", playSong);

    // Eksekusi ketika pengguna menekan tombol 'Enter' pada keyboard
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            playSong();
        }
    });
});
  
