// =================================================================
// BATTERY & IP TRACKER MODULE (TOP BAR JAPANESE ZEN STYLE) - batteryandip.js
// =================================================================

// 1. INJEKSI STYLING TAMPILAN FIXED DI PALING ATAS WEB (RESPONSIF FOR IPv6)
const geoBatteryStyle = document.createElement('style');
geoBatteryStyle.innerHTML = `
    .mizu-meta-topbar {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 16px;
        background: #ffffff;
        border-bottom: 1px solid #e5e5e5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        position: relative;
        z-index: 999;
        overflow: hidden;
    }
    .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #666;
        font-weight: 500;
        letter-spacing: 0.3px;
        white-space: nowrap;
        max-width: 68%; /* Membatasi area agar IPv6 panjang tidak menubruk komponen kanan */
    }
    .meta-item:last-child {
        max-width: 30%;
        justify-content: flex-end;
    }
    .meta-label {
        color: #aaa;
        text-transform: uppercase;
        font-size: 9px;
        font-weight: 700;
        flex-shrink: 0; /* Label teks konstan, tidak boleh mengecil */
    }
    .meta-value {
        color: #222;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        overflow: hidden;
        text-overflow: ellipsis; /* Otomatis memotong teks panjang menjadi ... jika layar sempit */
    }
    .status-accent-red {
        color: #BC002D;
        font-weight: bold;
    }
    .meta-geo-info {
        color: #888;
        font-weight: 400;
        font-size: 10px;
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 4px;
        flex-shrink: 0; /* Bendera dan Region diprioritaskan agar selalu terlihat */
        display: flex;
        align-items: center;
        gap: 4px;
    }
`;
document.head.appendChild(geoBatteryStyle);

// 2. LOGIKA UTAMA DETEKSI BATERAI PERANGKAT (ENGLISH)
async function initBatteryTracker() {
    const batteryStatusEl = document.getElementById('mizu-battery-status');
    if (!batteryStatusEl) return;

    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();

            function updateBatteryUI() {
                const isDesktopOrNoBattery = battery.charging && battery.chargingTime === 0 && battery.dischargingTime === Infinity;
                
                if (isDesktopOrNoBattery) {
                    batteryStatusEl.innerHTML = `🔌 <span style="color:#555;">AC Power</span>`;
                } else {
                    const levelPercent = Math.round(battery.level * 100);
                    const chargingStatus = battery.charging ? "⚡ " : "";
                    
                    let batteryIcon = "🔋";
                    if (levelPercent <= 20) batteryIcon = "🪫";

                    batteryStatusEl.innerHTML = `<span>${batteryIcon} ${chargingStatus}${levelPercent}%</span>`;
                    
                    if (levelPercent <= 15 && !battery.charging) {
                        batteryStatusEl.classList.add('status-accent-red');
                    } else {
                        batteryStatusEl.classList.remove('status-accent-red');
                    }
                }
            }

            updateBatteryUI();
            battery.addEventListener('levelchange', updateBatteryUI);
            battery.addEventListener('chargingchange', updateBatteryUI);

        } catch (error) {
            console.error("Error accessing Battery API:", error);
            batteryStatusEl.innerHTML = `🔌 <span>AC Power</span>`;
        }
    } else {
        batteryStatusEl.innerHTML = `🔌 <span>AC Power</span>`;
    }
}

// 3. LOGIKA UTAMA PENGAMBILAN ALAMAT IP & GEOLOCATION (IPWHO.IS)
async function initIpAddressTracker() {
    const ipStatusEl = document.getElementById('mizu-ip-status');
    if (!ipStatusEl) return;

    try {
        const response = await fetch('https://ipwho.is/');
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        
        if(data.success) {
            const ipAddress = data.ip;
            const region = data.region || data.city;
            const flagEmoji = data.flag.emoji;
            
            // Output terstruktur dengan class CSS baru yang fleksibel mencegah overflow
            ipStatusEl.innerHTML = `
                <span style="overflow: hidden; text-overflow: ellipsis;">${ipAddress}</span> 
                <span class="meta-geo-info"><span>${flagEmoji}</span> <span>${region}</span></span>
            `;
        } else {
            ipStatusEl.innerText = "Gagal memuat info lokasi";
        }
    } catch (error) {
        console.error("Error fetching IP Address & Geo:", error);
        ipStatusEl.innerText = "127.0.0.1 (Local/Proxy)";
    }
}

// 4. RENDERING DAN INJEKSI DI BAGIAN PALING ATAS BODY WEBSITE
function injectMetaPanel() {
    if (document.getElementById('mizu-user-topbar')) return;

    const topbar = document.createElement('div');
    topbar.id = 'mizu-user-topbar';
    topbar.className = 'mizu-meta-topbar';
    topbar.innerHTML = `
        <div class="meta-item">
            <span class="meta-label">IP & LOC:</span>
            <span class="meta-value" id="mizu-ip-status">Fetching...</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">POWER:</span>
            <span class="meta-value" id="mizu-battery-status">Detecting...</span>
        </div>
    `;

    document.body.insertBefore(topbar, document.body.firstChild);

    // Jalankan Tracker
    initBatteryTracker();
    initIpAddressTracker();
}

// Eksekusi otomatis ketika DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMetaPanel);
} else {
    injectMetaPanel();
}

// Ekspor fungsi global untuk refresh pasca login jika dibutuhkan
window.refreshUserMetaPanel = injectMetaPanel;
                    
