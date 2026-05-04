// 0. UTILS
function getJapanTime() {
    const now = new Date();
    const hours = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour: "numeric", hour12: true });
    const minutes = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", minute: "2-digit" });
    return hours.replace("時", "") + ":" + minutes;
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged , signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyAJDI39JipbKuDJ6YHO-rzADCdFs6qvf1k",
    authDomain: "snake-c2b54.firebaseapp.com",
    projectId: "snake-c2b54",
    storageBucket: "snake-c2b54.firebasestorage.app",
    messagingSenderId: "729896524620",
    appId: "1:729896524620:web:d1c2bc0f4d7e5dc2c7cde9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const DAILY_LIMIT = 30;
const WHATSAPP_LINK = "https://wa.me/message/7HHZHXNC5EVRB1";

// 2. UI STYLES
const style = document.createElement('style');
style.innerHTML = `
    #chat-box { display: flex; flex-direction: column; padding: 15px; gap: 15px; overflow-y: auto; height: 400px; scroll-behavior: smooth; }
    .chat-row { display: flex; width: 100%; margin-bottom: 5px; }
    .mizu-row { justify-content: flex-start; }
    .user-row { justify-content: flex-end; }
    .bubble { padding: 12px 16px; max-width: 85%; font-size: 14px; border-radius: 18px; line-height: 1.6; position: relative; }
    .mizu-bubble { background: #f0f0f0; color: #222; border-bottom-left-radius: 4px; }
    .user-bubble { background: #BC002D; color: #fff; border-bottom-right-radius: 4px; }
    
    /* Markdown & Code Blocks */
    .bubble pre { background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 8px; overflow-x: auto; margin: 10px 0; border: 1px solid #333; }
    .bubble code { font-family: 'Fira Code', monospace; font-size: 0.85rem; }
    .user-bubble code { background: rgba(0,0,0,0.2); padding: 2px 5px; border-radius: 4px; }
    
    .typing-cursor { display: inline-block; width: 7px; height: 15px; background: #BC002D; margin-left: 5px; animation: blink 0.8s infinite; vertical-align: middle; }
    @keyframes blink { 50% { opacity: 0; } }

    #auth-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999; }
    .google-btn { background: #4285F4; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .limit-banner { background: #fee2e2; color: #b91c1c; padding: 10px; border-radius: 8px; text-align: center; font-weight: bold; border: 1px solid #f87171; }
`;
document.head.appendChild(style);

// 3. AUTHENTICATION
onAuthStateChanged(auth, async (user) => {
    let overlay = document.getElementById('auth-overlay');
    if (!overlay) overlay = createAuthUI();

    if (user) {
        overlay.style.display = 'none';
        await syncUserLimit(user);
        loadLocalHistory();
    } else {
        overlay.style.display = 'flex';
    }
});

function createAuthUI() {
    const div = document.createElement('div');
    div.id = 'auth-overlay';
    div.innerHTML = `
        <h1 style="color:#BC002D; margin-bottom: 5px;">Fallen Mizu</h1>
        <p style="margin-bottom: 20px; opacity: 0.8;">Architectural AI Assistant</p>
        
        <div id="admin-login-area" style="width: 280px; display: flex; flex-direction: column; gap: 10px;">
            <input type="email" id="admin-email" placeholder="Admin Email" 
                style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            <input type="password" id="admin-password" placeholder="Password" 
                style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            <button id="admin-login-btn" style="background: #222; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                Login as Admin
            </button>
        </div>

        <div style="margin: 20px 0; color: #888; font-size: 14px; display: flex; align-items: center; gap: 10px;">
            <hr style="width: 50px; border: 0.5px solid #eee;"> Not an admin? <hr style="width: 50px; border: 0.5px solid #eee;">
        </div>

        <button class="google-btn" id="login-trigger">Sign in with Google</button>
    `;
    document.body.appendChild(div);

    // Event Listener untuk Google Login
    document.getElementById('login-trigger').onclick = () => signInWithPopup(auth, provider);

    // Event Listener untuk Admin Login (Email/Password)
    document.getElementById('admin-login-btn').onclick = async () => {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        
        if (!email || !password) return alert("Please fill in all fields.");

        try {
            const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert("Admin Login Failed, Wrong email or password: " + error.message);
                  
        }
    };

    return div;
}


// 4. DATABASE & LIMIT
async function syncUserLimit(user) {
    const today = new Date().toDateString();
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists() || snap.data().lastReset !== today) {
        await setDoc(userRef, { email: user.email, usageCount: 0, lastReset: today, isPremium: false }, { merge: true });
    } else if (snap.data().usageCount >= DAILY_LIMIT && !snap.data().isPremium) {
        applyLock();
    }
}

function applyLock() {
    const input = document.getElementById('user-input');
    if (!document.getElementById('limit-banner')) {
        const banner = document.createElement('div');
        banner.id = 'limit-banner';
        banner.className = 'limit-banner';
        banner.innerHTML = `Limit reached! <a href="${WHATSAPP_LINK}" target="_blank" style="color:inherit; text-decoration:underline;">Upgrade to Premium</a>`;
        document.getElementById('chat-box').prepend(banner);
    }
    if (input) { input.disabled = true; input.placeholder = "Daily limit reached..."; }
}

// 5. MEMORY & CHAT LOGIC
window.sendMessage = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (snap.data().usageCount >= DAILY_LIMIT && !snap.data().isPremium) return applyLock();

    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    const tickEl = renderRow('user', text);
    
    // Ambil histori untuk dikirim sebagai memory
    const history = JSON.parse(localStorage.getItem('mizu_history')) || [];
    saveLocal('user', text); // Simpan input user ke history

    const loadId = "loading-" + Date.now();
    renderRow('mizu', 'Mizu is thinking...', loadId);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: text,
                history: history // Mengirimkan memory ke API
            })
        });

        const data = await response.json();
        const loader = document.getElementById(loadId);
        if (loader) loader.remove();

        const reply = data.reply || "Mizu is offline.";
        await renderTypingEffect('mizu', reply);

        if (tickEl) tickEl.innerText = "✓✓";
        await updateDoc(userRef, { usageCount: increment(1) });
        
    } catch (err) {
        if(document.getElementById(loadId)) document.getElementById(loadId).innerText = "Connection error.";
    }
};

// NEW CHAT FUNCTION
window.newChat = () => {
    if (confirm("Mizu will forget this conversation. Start a new session?")) {
        localStorage.removeItem('mizu_history');
        document.getElementById('chat-box').innerHTML = "";
        renderRow('mizu', "Memory cleared. How can I help you today?");
    }
};

// 6. RENDERING ENGINE
function renderRow(role, text, id = null) {
    const chatBox = document.getElementById('chat-box');
    const row = document.createElement('div');
    row.className = `chat-row ${role}-row`;
    if (id) row.id = id;

    const bubble = document.createElement('div');
    bubble.className = `bubble ${role}-bubble`;
    
    const content = document.createElement('div');
    content.innerHTML = (typeof marked !== 'undefined') ? marked.parse(text) : text;

    const meta = document.createElement('div');
    meta.style.cssText = "display:flex; justify-content:flex-end; font-size:10px; opacity:0.6; margin-top:5px; gap:4px;";
    meta.innerHTML = `<span>${getJapanTime()}</span>`;

    const tick = document.createElement('span');
    if (role === "user") { tick.innerText = "✓"; tick.className = "tick"; meta.appendChild(tick); }

    bubble.appendChild(content);
    bubble.appendChild(meta);
    row.appendChild(bubble);
    chatBox.appendChild(row);

    if (typeof hljs !== 'undefined') row.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
    chatBox.scrollTop = chatBox.scrollHeight;
    return tick;
}

async function renderTypingEffect(role, fullText) {
    const chatBox = document.getElementById('chat-box');
    const row = document.createElement('div');
    row.className = `chat-row ${role}-row`;
    const bubble = document.createElement('div');
    bubble.className = `bubble ${role}-bubble`;
    const messageDiv = document.createElement('div');
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    
    bubble.appendChild(messageDiv);
    bubble.appendChild(cursor);
    row.appendChild(bubble);
    chatBox.appendChild(row);

    let i = 0;
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (i < fullText.length) {
                const currentText = fullText.substring(0, i + 1);
                messageDiv.innerHTML = (typeof marked !== 'undefined') ? marked.parse(currentText) : currentText;
                messageDiv.appendChild(cursor);
                i++;
                chatBox.scrollTop = chatBox.scrollHeight;
            } else {
                clearInterval(interval);
                cursor.remove();
                
                // Tambahkan Timestamp setelah selesai
                const meta = document.createElement('div');
                meta.style.cssText = "display:flex; justify-content:flex-end; font-size:10px; opacity:0.6; margin-top:5px;";
                meta.innerHTML = `<span>${getJapanTime()}</span>`;
                bubble.appendChild(meta);

                if (typeof hljs !== 'undefined') row.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
                saveLocal(role, fullText);
                resolve();
            }
        }, 15);
    });
}

// 7. STORAGE
function saveLocal(role, text) {
    let history = JSON.parse(localStorage.getItem('mizu_history')) || [];
    history.push({ role, text });
    localStorage.setItem('mizu_history', JSON.stringify(history.slice(-20))); // Simpan 20 chat terakhir
}

function loadLocalHistory() {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    chatBox.innerHTML = "";
    const history = JSON.parse(localStorage.getItem('mizu_history')) || [];
    history.forEach(item => renderRow(item.role, item.text));
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input');
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.sendMessage(); });
});
  // 8. LOGOUT LOGIC
const logoutBtn = document.getElementById('logout-btn');

if (logoutBtn) {
    logoutBtn.onclick = async () => {
        const confirmLogout = confirm("Are you sure you want to logout?");
        if (confirmLogout) {
            try {
                // Import fungsi signOut dari Firebase Auth
                const { signOut } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
                
                await signOut(auth);
                
                // Opsional: Bersihkan histori lokal saat logout jika ingin privasi maksimal
                // localStorage.removeItem('mizu_history');
                
                console.log("User signed out.");
            } catch (error) {
                console.error("Logout Error:", error.message);
                alert("Error during logout: " + error.message);
            }
        }
    };
}
