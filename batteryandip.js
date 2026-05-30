// =================================================================
// BATTERY & IP TRACKER MODULE (NON-BLOCKING TOP DESIGN) - batteryandip.js
// =================================================================

// 1. INJEKSI STYLING INTEGRASI TINGKAT TINGGI (TIDAK MERUSAK DOM UTAMA)
const geoBatteryStyle = document.createElement('style');
geoBatteryStyle.innerHTML = `
    .mizu-meta-topbar {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 25px;
        /* Menyediakan ruang 80px di kanan agar tidak menabrak tombol menu bulat portofolio */
        padding: 8px 80px 8px 20px; 
        background: rgba(255, 255, 255, 0.95);
        border-bottom: 1px solid #e5e5e5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        z-index: 10; /* Berada tepat di bawah tombol menu utama agar overlay tidak tertutup */
        pointer-events: auto;
    }
    .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        color: #555;
        font-weight: 500;
        letter-spacing: 0.3px;
    }
    .meta-label {
        color: #a0a0a0;
        text-transform: uppercase;
        font-size: 8.5px;
        font-weight: 700;
    }
    .meta-value {
        color: #222;
        font-weight: 600;
    }
    .status-accent-red {
        color: #BC002D;
        font-weight: bold;
    }
    
    /* PENYESUAIAN BODY AGAR ELEMEN UTAMA TURUN SECARA PRESISI DAN BORDER MIZU KEMBALI */
    body {
        padding-top: 33px !important; 
        position: relative;
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
                    batteryStatusEl.innerHTML = `🔌 <span style="color:#555;">AC Power (PC)</span>`;
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

// 3. LOGIKA UTAMA PENGAMBILAN ALAMAT IP
async function initIpAddressTracker() {
    const ipStatusEl = document.getElementById('mizu-ip-status');
    if (!ipStatusEl) return;

    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        ipStatusEl.innerText = data.ip;
    } catch (error) {
        console.error("Error fetching IP Address:", error);
        ipStatusEl.innerText = "127.0.0.1 (Local/Proxy)";
    }
}

// 4. RENDERING DAN INJEKSI DI STRUKTUR PALING ATAS
function injectMetaPanel() {
    if (document.getElementById('mizu-user-topbar')) return;

    const topbar = document.createElement('div');
    topbar.id = 'mizu-user-topbar';
    topbar.className = 'mizu-meta-topbar';
    topbar.innerHTML = `
        <div class="meta-item">
            <span class="meta-label">IP:</span>
            <span class="meta-value" id="mizu-ip-status">Fetching...</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">POWER:</span>
            <span class="meta-value" id="mizu-battery-status">Detecting...</span>
        </div>
    `;

    // Disuntikkan langsung ke awal body tanpa merusak wrapper div portofolio bawaan Anda
    document.body.insertBefore(topbar, document.body.firstChild);

    initBatteryTracker();
    initIpAddressTracker();
}

// Eksekusi otomatis ketika DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMetaPanel);
} else {
    injectMetaPanel();
}

window.refreshUserMetaPanel = injectMetaPanel;
        
