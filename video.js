// =================================================================
// MIZU MULTIMEDIA ENGINE - STANDARD NATIVE EMBED v13 (video.js)
// =================================================================

/**
 * Memutar trek video menggunakan Native Iframe Resmi tanpa pemotongan (No Clipping)
 * Jalur endpoint backend telah diperbarui menuju api/videosearch.js
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

    // Render Player: Video utuh 100% tanpa clipping dengan tombol close di luar frame
    inlineVideoContainer.innerHTML = `
        <div style="position: relative; width: 100%; max-width: 450px; display: flex; flex-direction: column;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 4px; width: 100%;">
                <div style="font-size: 0.75rem; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 85%;">
                    Playing Video: <span style="font-weight: 500; color: #666;">${title}</span>
                </div>
                <div onclick="closeInlineVideoPlayer()" style="width: 24px; height: 24px; background: #e0e0e0; color: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; cursor: pointer; font-weight: bold; user-select: none; transition: background 0.2s; -webkit-tap-highlight-color: transparent;">×</div>
            </div>

            <div style="position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); background: #000;">
                <iframe
                    src="https://www.youtube.com/embed/${cleanVideoId}?autoplay=1&modestbranding=1&rel=0&controls=1&showinfo=0&iv_load_policy=3&playsinline=1&fs=1"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                ></iframe>
            </div>
            
        </div>
        
        <div style="margin-top: 14px; display: flex; flex-direction: column; align-items: center; width: 100%;">
            <label style="color: #999; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Mizu Official Player Tunnel</label>
            <div style="font-size: 0.65rem; color: #666; margin-top: 4px; font-style: italic; text-align: center; padding: 0 10px;">
                Controls, subtitles, and quality engine are handled natively by YouTube.
            </div>
        </div>
    `;

    inlineVideoContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Fungsi untuk menghentikan video dan menghapus elemen player
 */
function closeInlineVideoPlayer() {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    if (inlineContainer) {
        inlineContainer.remove();
    }
}
