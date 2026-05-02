/**
 * ai.js - Mizu Client Side (Final Vercel Version)
 * Integrasi Chat: Mizu (Kiri) & User (Kanan)
 */

// 1. Gabungkan CSS ke dalam Document
const style = document.createElement('style');
style.innerHTML = `
    #chat-box {
        display: flex;
        flex-direction: column;
        padding: 15px;
        overflow-y: auto;
        gap: 12px;
    }
    .chat-row {
        display: flex;
        width: 100%;
    }
    .mizu-row { justify-content: flex-start; }
    .user-row { justify-content: flex-end; }

    .bubble {
        padding: 10px 16px;
        max-width: 75%;
        font-size: 14px;
        line-height: 1.5;
        position: relative;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .mizu-bubble {
        background: #ffffff;
        color: #333;
        border: 1px solid #eee;
        border-radius: 18px 18px 18px 4px;
    }

    .user-bubble {
        background: #BC002D; /* Merah Aksen Fallen Mizu */
        color: #ffffff;
        border-radius: 18px 18px 4px 18px;
    }

    .loading-dot {
        font-style: italic;
        color: #888;
        font-size: 12px;
    }
`;
document.head.appendChild(style);

// 2. Logika Pengiriman Pesan
async function sendMessage() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    input.value = '';

    // Tampilkan Pesan User (Kanan)
    chatBox.innerHTML += `
        <div class="chat-row user-row">
            <div class="bubble user-bubble">${message}</div>
        </div>`;
    
    // Tampilkan Loading Mizu (Kiri)
    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `
        <div id="${loadingId}" class="chat-row mizu-row">
            <div class="bubble mizu-bubble loading-dot">Mizu sedang mengetik...</div>
        </div>`;
    
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        
        // Hapus Loading
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu sedang bermeditasi, coba lagi nanti.";

        // Tampilkan Jawaban Mizu (Kiri)
        chatBox.innerHTML += `
            <div class="chat-row mizu-row">
                <div class="bubble mizu-bubble">${reply}</div>
            </div>`;

    } catch (error) {
        console.error("Mizu Error:", error);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.innerText = "Koneksi terputus.";
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

// 3. Event Listener Enter Key
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});
