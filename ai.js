/**
 * ai.js - Mizu Professional (English Version)
 * Features: Google Auth, Daily Limit (5 Chats), Persistence, Left/Right Chat
 */

// 1. STYLES & UI
const style = document.createElement('style');
style.innerHTML = `
    #chat-box { display: flex; flex-direction: column; padding: 15px; gap: 15px; overflow-y: auto; height: 400px; }
    .chat-row { display: flex; width: 100%; }
    .mizu-row { justify-content: flex-start; }
    .user-row { justify-content: flex-end; }
    .bubble { padding: 10px 15px; max-width: 80%; font-size: 14px; border-radius: 15px; }
    .mizu-bubble { background: #f1f1f1; color: #333; border-bottom-left-radius: 2px; }
    .user-bubble { background: #BC002D; color: #fff; border-bottom-right-radius: 2px; }
    
    /* Auth & Limit UI */
    #auth-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.95); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999; }
    .limit-warning { color: #BC002D; font-weight: bold; text-align: center; padding: 20px; border: 2px dashed #BC002D; border-radius: 10px; display: none; }
    .google-btn { background: white; border: 1px solid #ddd; padding: 10px 20px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: bold; }
`;
document.head.appendChild(style);

// 2. CONFIGURATION
const DAILY_LIMIT = 10; // Batas chat gratis per hari
const WHATSAPP_LINK = "https://wa.me/+817094251640"; // Link owner

// 3. GOOGLE AUTH SIMULATION (Since we need Firebase/Auth Client for real Google Login)
// Saya menggunakan skema yang kompatibel dengan Vercel & UI
function initGoogleAuth() {
    const user = localStorage.getItem('mizu_user');
    if (!user) {
        const overlay = document.createElement('div');
        overlay.id = 'auth-overlay';
        overlay.innerHTML = `
            <h2>Welcome to Mizu AI</h2>
            <p>Please login to continue</p>
            <button class="google-btn" onclick="loginSimulation()">
                <img src="https://www.google.com/favicon.ico" width="20"> Sign in with Google
            </button>
        `;
        document.body.appendChild(overlay);
    } else {
        checkDailyLimit();
    }
}

window.loginSimulation = () => {
    // Simulasi Login - Dalam produksi nyata, hubungkan ke Firebase Auth
    localStorage.setItem('mizu_user', 'Steven_User');
    location.reload();
};

// 4. LIMIT LOGIC
function checkDailyLimit() {
    const today = new Date().toDateString();
    let stats = JSON.parse(localStorage.getItem('mizu_stats')) || { date: today, count: 0 };
    
    if (stats.date !== today) {
        stats = { date: today, count: 0 };
        localStorage.setItem('mizu_stats', JSON.stringify(stats));
    }

    if (stats.count >= DAILY_LIMIT) {
        lockChat();
    }
    return stats.count;
}

function lockChat() {
    const input = document.getElementById('user-input');
    const warning = document.createElement('div');
    warning.className = 'limit-warning';
    warning.style.display = 'block';
    warning.innerHTML = `
        DAILY LIMIT REACHED!<br>
        Please contact the owner for a monthly subscription to get Unlimited Access.<br>
        <a href="${WHATSAPP_LINK}" target="_blank" style="color:#BC002D; text-decoration:underline;">Subscribe Now</a>
    `;
    document.getElementById('chat-box').prepend(warning);
    if(input) {
        input.disabled = true;
        input.placeholder = "Chat Locked - Subscription Required";
    }
}

function incrementLimit() {
    let stats = JSON.parse(localStorage.getItem('mizu_stats'));
    stats.count += 1;
    localStorage.setItem('mizu_stats', JSON.stringify(stats));
}

// 5. STORAGE & HISTORY (Existing Logic)
function saveChatToLocal(role, text) {
    let history = JSON.parse(localStorage.getItem('mizu_chat_history')) || [];
    history.push({ role, text });
    localStorage.setItem('mizu_chat_history', JSON.stringify(history));
}

function loadChatHistory() {
    const chatBox = document.getElementById('chat-box');
    const history = JSON.parse(localStorage.getItem('mizu_chat_history')) || [];
    history.forEach(item => {
        const rowClass = item.role === 'user' ? 'user-row' : 'mizu-row';
        const bubbleClass = item.role === 'user' ? 'user-bubble' : 'mizu-bubble';
        chatBox.innerHTML += `<div class="chat-row ${rowClass}"><div class="bubble ${bubbleClass}">${item.text}</div></div>`;
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 6. SEND MESSAGE (Main Function)
async function sendMessage() {
    const count = checkDailyLimit();
    if (count >= DAILY_LIMIT) return;

    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    if (!input || !input.value.trim()) return;
    
    const text = input.value.trim();
    input.value = '';

    // Show User Message
    chatBox.innerHTML += `<div class="chat-row user-row"><div class="bubble user-bubble">${text}</div></div>`;
    saveChatToLocal('user', text);
    
    const tempId = "load-" + Date.now();
    chatBox.innerHTML += `<div id="${tempId}" class="chat-row mizu-row"><div class="bubble mizu-bubble">Thinking...</div></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });

        const result = await response.json();
        document.getElementById(tempId).remove();

        const mizuText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu is offline.";
        chatBox.innerHTML += `<div class="chat-row mizu-row"><div class="bubble mizu-bubble">${mizuText}</div></div>`;
        
        saveChatToLocal('mizu', mizuText);
        incrementLimit(); // Tambah hitungan limit setelah sukses chat
        checkDailyLimit(); // Cek lagi apakah sudah limit setelah chat ini
        
    } catch (e) {
        document.getElementById(tempId).innerHTML = "Error connecting to AI.";
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 7. INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    initGoogleAuth();
    loadChatHistory();
    const input = document.getElementById('user-input');
    if(input) {
        input.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
    }
});
