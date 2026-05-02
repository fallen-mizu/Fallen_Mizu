/**
 * ai.js - Integrated English UI with LocalStorage History
 * Positions: Mizu (Left) | User (Right)
 */

// 1. Inject UI Styles (Ditambahkan style untuk tombol delete)
const style = document.createElement('style');
style.innerHTML = `
    #chat-box {
        display: flex;
        flex-direction: column;
        padding: 15px;
        gap: 15px;
        overflow-y: auto;
        height: 400px;
    }
    .chat-row { display: flex; width: 100%; }
    .mizu-row { justify-content: flex-start; }
    .user-row { justify-content: flex-end; }

    .bubble {
        padding: 10px 15px;
        max-width: 80%;
        font-size: 14px;
        line-height: 1.5;
        border-radius: 15px;
    }

    .mizu-bubble {
        background: #f1f1f1;
        color: #333;
        border-bottom-left-radius: 2px;
    }

    .user-bubble {
        background: #BC002D;
        color: #fff;
        border-bottom-right-radius: 2px;
    }

    .loading { font-style: italic; opacity: 0.7; font-size: 12px; }

    /* Delete Button Style */
    .clear-chat-btn {
        background: transparent;
        color: #888;
        border: 1px solid #ddd;
        padding: 5px 10px;
        font-size: 11px;
        cursor: pointer;
        margin-bottom: 10px;
        border-radius: 4px;
        align-self: flex-end;
    }
    .clear-chat-btn:hover { background: #eee; }
`;
document.head.appendChild(style);

// --- LOGIKA HISTORY ---

// Fungsi untuk menyimpan chat ke localStorage
function saveChatToLocal(role, text) {
    let history = JSON.parse(localStorage.getItem('mizu_chat_history')) || [];
    history.push({ role, text });
    localStorage.setItem('mizu_chat_history', JSON.stringify(history));
}

// Fungsi untuk memuat chat dari localStorage saat refresh
function loadChatHistory() {
    const chatBox = document.getElementById('chat-box');
    const history = JSON.parse(localStorage.getItem('mizu_chat_history')) || [];
    
    if (history.length > 0) {
        // Tambahkan tombol hapus jika ada riwayat
        renderDeleteButton();
    }

    history.forEach(item => {
        const rowClass = item.role === 'user' ? 'user-row' : 'mizu-row';
        const bubbleClass = item.role === 'user' ? 'user-bubble' : 'mizu-bubble';
        chatBox.innerHTML += `
            <div class="chat-row ${rowClass}">
                <div class="bubble ${bubbleClass}">${item.text}</div>
            </div>`;
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Fungsi untuk membuat tombol hapus
function renderDeleteButton() {
    if (!document.getElementById('clear-btn')) {
        const btn = document.createElement('button');
        btn.id = 'clear-btn';
        btn.className = 'clear-chat-btn';
        btn.innerText = 'Clear Chat History';
        btn.onclick = clearChat;
        document.getElementById('chat-box').before(btn);
    }
}

// Fungsi untuk menghapus semua chat
function clearChat() {
    if (confirm("Delete all chat history?")) {
        localStorage.removeItem('mizu_chat_history');
        location.reload(); // Refresh halaman untuk membersihkan tampilan
    }
}

// --- AKHIR LOGIKA HISTORY ---

async function sendMessage() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    
    if (!input || !input.value.trim()) return;
    
    const text = input.value.trim();
    input.value = '';

    // Render tombol hapus saat pesan pertama dikirim
    renderDeleteButton();

    // Show & Save User Message
    chatBox.innerHTML += `
        <div class="chat-row user-row">
            <div class="bubble user-bubble">${text}</div>
        </div>`;
    saveChatToLocal('user', text);
    
    const tempId = "load-" + Date.now();
    chatBox.innerHTML += `
        <div id="${tempId}" class="chat-row mizu-row">
            <div class="bubble mizu-bubble loading">Mizu is contemplating...</div>
        </div>`;
    
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });

        const result = await response.json();
        const loader = document.getElementById(tempId);
        if (loader) loader.remove();

        if (result.error) {
            chatBox.innerHTML += `<div class="chat-row mizu-row"><div class="bubble mizu-bubble" style="color:red">Error: ${result.error}</div></div>`;
        } else {
            const mizuText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu remains silent.";
            chatBox.innerHTML += `
                <div class="chat-row mizu-row">
                    <div class="bubble mizu-bubble">${mizuText}</div>
                </div>`;
            // Save Mizu Message
            saveChatToLocal('mizu', mizuText);
        }
    } catch (e) {
        const loader = document.getElementById(tempId);
        if (loader) loader.innerHTML = `<div class="bubble mizu-bubble" style="color:red">Connection failed.</div>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory(); // Muat history saat web dibuka
    const input = document.getElementById('user-input');
    if(input) {
        input.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
    }
});
