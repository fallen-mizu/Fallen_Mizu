// =================================================================
// BATTERY & IP TRACKER MODULE - batteryandip.js
// =================================================================

// 1. INJEKSI STYLING TAMPILAN (DESIGN SYSTEM JEPANG/MINIMALIS)
const geoBatteryStyle = document.createElement('style');
geoBatteryStyle.innerHTML = `
    .mizu-meta-panel {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 12px 15px;
        background: #ffffff;
        border-bottom: 1px solid #f0f0f0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        color: #555;
        font-weight: 500;
        letter-spacing: 0.3px;
    }
    .meta-label {
        color: #999;
        text-transform: uppercase;
        font-size: 9px;
        font-weight: 700;
    }
    .meta-value {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #222;
    }
    .battery-icon-wrapper {
        display: inline-flex;
        align-items: center;
    }
    .status-accent-red {
        color: #BC002D;
        font-weight: bold;
    }
`;
document.head.appendChild(geoBatteryStyle);

// 2. LOGIKA UTAMA DETEKSI BATERAI PERANGKAT
async function initBatteryTracker() {
    const batteryStatusEl = document.getElementById('mizu-battery-status');
    if (!batteryStatusEl) return;

    // Cek apakah browser mendukung Battery Status API
    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();

            function updateBatteryUI() {
                // Perangkat Desktop PC biasanya mengembalikan charging = true dan level = 1 (100%) tanpa waktu pengosongan
                // Atau jika kondisi baterai tidak terhingga/konstan tercolok tanpa degradasi baterai internal
                const isDesktopOrNoBattery = battery.charging && battery.chargingTime === 0 && battery.dischargingTime === Infinity;
                
                if (isDesktopOrNoBattery) {
                    // Tampilan Mode Komputer / Tanpa Baterai (Simbol Kabel AC Daya Terhubung)
                    batteryStatusEl.innerHTML = `🔌 <span style="color:#666;">Desktop PC (Kabel Daya)</span>`;
                } else {
                    // Tampilan Mode Perangkat Berbaterai (Smartphone / Laptop)
                    const levelPercent = Math.round(battery.level * 100);
                    const chargingStatus = battery.charging ? "⚡ " : "";
                    
                    let batteryIcon = "🔋";
                    if (levelPercent <= 20) batteryIcon = "🪫";

                    batteryStatusEl.innerHTML = `
                        <span>${batteryIcon} ${chargingStatus}${levelPercent}%</span>
                    `;
                    
                    // Berikan aksen merah khas Jepang jika baterai kritis di bawah 15%
                    if (levelPercent <= 15 && !battery.charging) {
                        batteryStatusEl.classList.add('status-accent-red');
                    } else {
                        batteryStatusEl.classList.remove('status-accent-red');
                    }
                }
            }

            // Jalankan saat pertama kali dimuat & pasang event listener perubahan status
            updateBatteryUI();
            battery.addEventListener('levelchange', updateBatteryUI);
            battery.addEventListener('chargingchange', updateBatteryUI);

        } catch (error) {
            console.error("Gagal membaca Battery API:", error);
            batteryStatusEl.innerHTML = `🔌 <span>Kabel Daya (PC)</span>`;
        }
    } else {
        // Fallback jika browser lawas atau tidak mendukung API ini (dianggap sebagai Komputer/Kabel)
        batteryStatusEl.innerHTML = `🔌 <span>Kabel Daya (PC)</span>`;
    }
}

// 3. LOGIKA UTAMA PENGAMBILAN ALAMAT IP (IP ADDRESS LOOKUP)
async function initIpAddressTracker() {
    const ipStatusEl = document.getElementById('mizu-ip-status');
    if (!ipStatusEl) return;

    try {
        // Menggunakan layanan ipify API publik yang cepat dan andal melacak IPv4/IPv6
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        ipStatusEl.innerText = data.ip;
    } catch (error) {
        console.error("Gagal mendapatkan Alamat IP:", error);
        ipStatusEl.innerText = "127.0.0.1 (Local/Proxy)";
    }
}

// 4. RENDERING DAN INJEKSI WIDGET KE DALAM DOM WEB
function injectMetaPanel() {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;

    // Pastikan panel pelacak ini hanya dibuat satu kali saja di halaman web
    if (document.getElementById('mizu-user-meta-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'mizu-user-meta-panel';
    panel.className = 'mizu-meta-panel';
    panel.innerHTML = `
        <div class="meta-row">
            <span class="meta-label">IP Address Anda</span>
            <span class="meta-value" id="mizu-ip-status">Mengambil data...</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Status Daya Perangkat</span>
            <span class="meta-value" id="mizu-battery-status">Mendeteksi...</span>
        </div>
    `;

    // Menyisipkan panel tepat di bagian atas kontainer obrolan (di atas chat-box)
    chatBox.parentNode.insertBefore(panel, chatBox);

    // Jalankan tracker setelah elemen sukses disuntikkan ke DOM
    initBatteryTracker();
    initIpAddressTracker();
}

// Eksekusi otomatis ketika dokumen web siap dimuat atau dipanggil ulang oleh sistem login
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMetaPanel);
} else {
    injectMetaPanel();
}

// Ekspor fungsi jika ingin dihubungkan atau dipanggil ulang secara manual pasca login sukses di ai.js
window.refreshUserMetaPanel = injectMetaPanel;
