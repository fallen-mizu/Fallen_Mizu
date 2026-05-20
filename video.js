// Temukan fungsi loadInlineResolutionWithQualities di video.js, lalu sesuaikan bagian perakitan tombolnya:

function loadInlineResolutionWithQualities(targetQuality, allowedQualitiesList) {
    const inlineContainer = document.getElementById("mizu-inline-video-container");
    if (!inlineContainer) return;

    const videoId = inlineContainer.getAttribute("data-active-id");
    const title = inlineContainer.getAttribute("data-active-title");

    let lastTimestamp = 0;
    let isPlaying = true;
    
    if (mizuPlyrInstance) {
        lastTimestamp = mizuPlyrInstance.currentTime;
        isPlaying = mizuPlyrInstance.playing;
        mizuPlyrInstance.destroy();
        mizuPlyrInstance = null;
    }

    // Bersihkan parameter format agar hanya berupa angka saat dikirim ke backend (misal "1080p60" diubah jadi "1080")
    const cleanFormatNumber = targetQuality.replace("p", "").replace("60", "");

    const finalVercelProxyUrl = `/api/search?id=${encodeURIComponent(videoId)}&format=${cleanFormatNumber}&stream=true`;

    // Bangun tombol dinamis murni dari manifest YouTube asli
    let resolutionButtonsHtml = '';
    allowedQualitiesList.forEach(q => {
        // q sudah otomatis berisi string asli seperti "1080p60" atau "720p" dari Cloudflare
        resolutionButtonsHtml += `
            <button class="inline-res-btn" data-res="${q}" onclick="loadInlineResolutionWithQualities('${q}', [${allowedQualitiesList.map(item => `'${item}'`).join(',')}])">
                ${q}
            </button>
        `;
    });

    // ... sisa kode HTML penyusun Plyr (tetap pertahankan mizuPlyrInstance seperti kode sebelumnya) ...
    // Pastikan pencarian class active-inline-res di bagian bawah dicocokkan dengan targetQuality
    inlineContainer.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: bold; color: #333; text-align: center; margin-bottom: 12px; width: 100%; max-width: 450px;">
            📺 Playing Video: <span style="font-weight: 500; color: #666;">${title}</span>
        </div>
        <div style="position: relative; width: 100%; max-width: 450px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); background: #000;">
            <video id="mizu-inline-video-element" playsinline controls crossorigin="anonymous">
                <source src="${finalVercelProxyUrl}" type="video/mp4" />
            </video>
            <div onclick="closeInlineVideoPlayer()" style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; font-weight: bold; z-index: 10;">×</div>
        </div>
        <div style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;">
            <label style="color: #999; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Mizu Native YouTube Tracker</label>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
                ${resolutionButtonsHtml}
            </div>
        </div>
        <style>
            :root { --plyr-color-main: #BC002D; }
            .inline-res-btn { background: #ffffff; color: #555; border: 1px solid rgba(0,0,0,0.08); padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; cursor: pointer; transition: all 0.2s; }
            .inline-res-btn.active-inline-res { background: #BC002D !important; color: white !important; border-color: #BC002D !important; }
            .plyr { border-radius: 12px; }
        </style>
    `;

    mizuPlyrInstance = new Plyr("#mizu-inline-video-element", {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        ratio: '16:9'
    });

    mizuPlyrInstance.on('ready', () => {
        mizuPlyrInstance.currentTime = lastTimestamp;
        if (isPlaying) mizuPlyrInstance.play().catch(e => console.log(e));
    });

    document.querySelectorAll(".inline-res-btn").forEach(btn => {
        if (btn.getAttribute("data-res") === targetQuality) {
            btn.classList.add("active-inline-res");
        }
    });
}
