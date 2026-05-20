// =================================================================
// MIZU MULTIMEDIA ENGINE - ABSOLUTE CLEAN EMBED v11 (video.js)
// =================================================================

/**
 * Memutar trek video menggunakan Native API Resmi Google dengan Trik Lapisan Clipping CSS
 * @param {string} videoId - ID Video YouTube
 * @param {string} title - Judul video untuk UI header
 */
async function playVideoTrack(videoId, title) {
    const songListContainer = document.getElementById("yt-song-list");
    if (!songListContainer) return;

    let inlineVideoContainer = document.getElementById("mizu-inline-video-container");
    if (!inlineVideoContainer) {
        inlineVideoContainer = document.createElement("div");
        inlineVideoContainer.id = "mizu-inline-video-container";
        inlineVideoContainer.style = "margin-top: 25px; width: 100%; display: flex; flex-direction: column; align-items: center; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 20px;";
        songListContainer.after(inlineVideoContainer);
    }

    const cleanVideoId = videoId.replace("youtube_", "").trim();
    
    inlineVideoContainer.setAttribute("data-active-id", cleanVideoId);
    inlineVideoContainer.setAttribute("data-active-title", title);

    // Render Player: Menggunakan trik pembesaran skala iframe 
    // untuk menyembunyikan tombol share atas & watermark bawah bawaan YouTube
    inlineVideoContainer.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: bold; color: #333; text-align: center; margin-bottom: 12px; width: 100%; max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px;">
            Playing Video: <span style="font-weight: 500; color: #666;">${title}</span>
        </div>

        <div style="position: relative; width: 100%; max-width: 450px; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); background: #000;">
            
            <div style="position: absolute; top: -12%; left: -2%; width: 104%; height: 124%; overflow: hidden;">
                <iframe
                    src="https://www.youtube.com/embed/${cleanVideoId}?autoplay=1&modestbranding=1&rel=0&controls=1&showinfo=0&iv_load_policy=3&playsinline=1&fs=1"
                    style="width: 100%; height: 100%; border: 0;"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                ></iframe>
            </div>
            
            <div onclick="closeInlineVideoPlayer()" style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; font-weight: bold; z-index: 99; user-select: none; -webkit-tap-highlight-color: transparent;">×</div>
        </div>
        
        <div style="margin-top: 12px; display: flex; flex-direction: column; align-items: center; width: 100%;">
            <label style="color: #999; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Mizu Official Player Tunnel</label>
            <div style="font-size: 0.65rem; color: #666; margin-top: 4px; font-style: italic; text-align: center; padding: 0 10px;">
                Controls, subtitles, and quality engine are handled natively by YouTube.
            </div>
        </div>
    `;

    // Gulir layar secara halus ke posisi pemutar video
    inlineVideoContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Fungsi untuk menghentikan video dan menghapus elemen player dari halaman web
 */
function closeInlineVideoPlayer() {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    if (inlineContainer) {
        inlineContainer.remove();
    }
}
