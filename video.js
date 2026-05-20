// =================================================================
// MIZU MULTIMEDIA ENGINE - NO PLYR / PURE BROWSER NATIVE (video.js)
// =================================================================

/**
 * Memutar trek video langsung menggunakan player internal default browser (iOS/Android Native)
 * @param {string} videoId - ID Video YouTube
 * @param {string} title - Judul video
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
    
    // Tampilkan indikator loading minimalis khas Mizu
    inlineVideoContainer.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: bold; color: #BC002D; text-align: center; padding: 20px;">
            ⏳ Fetching Internal Browser Stream...
        </div>
    `;

    try {
        // Ambil URL file .mp4 langsung dari backend gateway
        const response = await fetch(`/api/search?id=${encodeURIComponent(cleanVideoId)}&stream=true`);
        const data = await response.json();

        if (!data.url) throw new Error("Stream URL empty");

        // Render tag <video> murni tanpa pembungkus pihak ketiga mana pun
        inlineVideoContainer.innerHTML = `
            <div style="font-size: 0.75rem; font-weight: bold; color: #333; text-align: center; margin-bottom: 12px; width: 100%; max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px;">
                📺 Playing Video: <span style="font-weight: 500; color: #666;">${title}</span>
            </div>

            <div style="position: relative; width: 100%; max-width: 450px; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); background: #000;">
                <video 
                    src="${data.url}" 
                    controls 
                    autoplay
                    playsinline
                    style="width: 100%; height: 100%; object-fit: contain;"
                ></video>
                
                <div onclick="closeInlineVideoPlayer()" style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; font-weight: bold; z-index: 10; user-select: none; -webkit-tap-highlight-color: transparent;">×</div>
            </div>

            <div style="margin-top: 10px; font-size: 0.6rem; color: #999; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
                Mizu Pure Device Decoder
            </div>
        `;

        // Picu auto-play langsung pada elemen video internal
        const nativeVideo = inlineVideoContainer.querySelector('video');
        if (nativeVideo) {
            nativeVideo.play().catch(err => console.log("Native context playback deferred:", err));
        }

    } catch (error) {
        console.error(error);
        inlineVideoContainer.innerHTML = `
            <div style="font-size: 0.7rem; color: #BC002D; font-weight: bold; text-align: center; padding: 15px;">
                ❌ Gagal memuat internal player. Coba trek lagu yang lain.
            </div>
        `;
    }

    inlineVideoContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Hapus elemen pemutar
 */
function closeInlineVideoPlayer() {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    if (inlineContainer) {
        inlineContainer.remove();
    }
}
