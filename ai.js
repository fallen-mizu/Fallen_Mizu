/**
 * ai.js - Mizu Client Side (Rebuild)
 * Menghubungkan website portofolio ke Server Node.js di Pterodactyl
 */

// GANTI DENGAN URL API SERVER PTERODACTYL ANDA
// Contoh: "https://api.fallenmizu.com/ask-mizu" atau "http://103.xxx.xxx.xxx:3000/ask-mizu"
const MIZU_API_URL = "http://IP_VPS_ANDA:PORT_ANDA/ask-mizu";

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    
    if (!inputField || !chatBox) return;

    const message = inputField.value.trim();
    if (!message) return;

    // 1. Tampilkan pesan User ke dalam Chatbox
    chatBox.innerHTML += `
        <div style="margin-bottom: 12px; text-align: right;">
            <span style="background: rgba(0,0,0,0.05); padding: 8px 12px; border-radius: 12px; display: inline-block;">
                <strong>You:</strong> ${message}
            </span>
        </div>`;
    
    inputField.value = ''; // Kosongkan input
    
    // 2. Buat elemen Loading (Mizu sedang berpikir)
    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `
        <div id="${loadingId}" style="margin-bottom: 12px; color: #888; font-style: italic; font-size: 0.8rem;">
            Mizu is contemplating...
        </div>`;
    
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // 3. Kirim permintaan ke Server Backend Node.js
        const response = await fetch(MIZU_API_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ 
                message: message 
            })
        });

        // Cek jika koneksi ke server gagal (misal: Server mati)
        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Hapus elemen loading
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        // 4. Tampilkan respon dari Mizu
        // Asumsi server Anda mengembalikan format: { reply: "..." } atau format langsung dari Gemini
        let mizuReply = "";
        if (data.candidates && data.candidates[0].content) {
            mizuReply = data.candidates[0].content.parts[0].text;
        } else if (data.reply) {
            mizuReply = data.reply;
        } else {
            mizuReply = "Mizu is silent. Please check the server logs.";
        }

        chatBox.innerHTML += `
            <div style="margin-bottom: 12px; color: var(--wasabi-red);">
                <strong>Mizu:</strong> ${mizuReply}
            </div>`;

    } catch (error) {
        console.error("Mizu Connection Error:", error);
        
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        chatBox.innerHTML += `
            <div style="color: #888; font-size: 0.75rem; margin-bottom: 12px; border-left: 2px solid #BC002D; padding-left: 10px;">
                Mizu cannot be reached. 
                <br><small>Error: ${error.message}</small>
            </div>`;
    }

    // Scroll otomatis ke bawah
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 5. Inisialisasi Event Listener setelah halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('user-input');
    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});
