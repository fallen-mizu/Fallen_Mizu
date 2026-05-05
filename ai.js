// 0. UTILS
function getJapanTime(timestamp = null) {
    const date = timestamp ? new Date(timestamp) : new Date();
    const hours = date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour: "numeric", hour12: true });
    const minutes = date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", minute: "2-digit" });
    return hours.replace("時", "") + ":" + minutes;
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 2. UI STYLES (Isi tetap sama seperti kode awal kamu)
const style = document.createElement('style');
style.innerHTML = `
    .code-container { position: relative; }
    .copy-btn { 
        position: absolute; top: 8px; right: 8px; 
        background: #333; color: #fff; border: 1px solid #555; 
        padding: 4px 8px; font-size: 10px; border-radius: 4px; 
        cursor: pointer; opacity: 0.7; transition: 0.3s; z-index: 10;
    }
    .copy-btn:hover { opacity: 1; background: #BC002D; border-color: #BC002D; }
    .copy-btn.copied { background: #10b981; border-color: #10b981; }
    #chat-box { 
        display: flex; 
        flex-direction: column; 
        padding: 15px; 
        gap: 10px; 
        overflow-y: auto; 
        height: 450px; 
        scroll-behavior: smooth; 
        background: #fdfdfd; /* Warna background lebih soft */
    }
    
    .chat-row { 
        display: flex; 
        width: 100%; 
        margin-bottom: 2px; 
    }
    
    .mizu-row { justify-content: flex-start; }
    .user-row { justify-content: flex-end; }
    
    .bubble { 
        padding: 8px 12px; 
        /* Maksimal lebar 75% agar tidak terlalu lebar ke samping */
        max-width: 75%; 
        font-size: 14px; 
        line-height: 1.5; 
        position: relative; 
        box-shadow: 0 1px 2px rgba(0,0,0,0.1); /* Shadow halus ala WA */
    }
    
    .mizu-bubble { 
        background: #ffffff; 
        color: #222; 
        border-radius: 0px 15px 15px 15px; /* Sisi kiri atas tajam */
        border: 1px solid #f0f0f0;
    }
    
    .user-bubble { 
    background: #BC002D; 
    color: #ffffff; 
    border-radius: 15px 0px 15px 15px; 
}

    
    .bubble pre { background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 8px; overflow-x: auto; margin: 10px 0; border: 1px solid #333; }
    .bubble code { font-family: 'Fira Code', monospace; font-size: 0.85rem; }
    .typing-cursor { display: inline-block; width: 7px; height: 15px; background: #BC002D; margin-left: 5px; animation: blink 0.8s infinite; vertical-align: middle; }
    @keyframes blink { 50% { opacity: 0; } }
    #auth-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999; }
    .google-btn { background: #4285F4; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .limit-banner { background: #fee2e2; color: #b91c1c; padding: 10px; border-radius: 8px; text-align: center; font-weight: bold; border: 1px solid #f87171; margin-bottom: 10px; }
    .status-container { padding: 10px 15px; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #f5f5f5; }
    .status-indicator { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 12px; }
    .status-online { color: #10b981; background: #ecfdf5; border: 1px solid #d1fae5; }
    .status-offline { color: #ef4444; background: #fef2f2; border: 1px solid #fee2e2; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-online .status-dot { background: #10b981; box-shadow: 0 0 5px #10b981; animation: pulse 2s infinite; }
    .status-offline .status-dot { background: #ef4444; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
`;
document.head.appendChild(style);

// 3. REAL-TIME STATUS LISTENER
function listenToMizuStatus() {
    const statusRef = doc(db, "system", "status");
    onSnapshot(statusRef, (docSnap) => {
        const el = document.getElementById('mizu-status');
        if (!el) return;
        
        if (docSnap.exists()) {
            const isOnline = docSnap.data().isOnline;
            if (isOnline === true) {
                el.className = "status-indicator status-online";
                el.innerHTML = `<span class="status-dot"></span> Mizu Online`;
            } else {
                el.className = "status-indicator status-offline";
                el.innerHTML = `<span class="status-dot"></span> Mizu Offline`;
            }
        } else {
            console.error("DOKUMEN STATUS TIDAK DITEMUKAN DI FIRESTORE!");
            el.innerHTML = "Status Error: Doc Missing";
        }
    }, (error) => {
        // INI AKAN MEMBERITAHU KITA KENAPA DATABASE REJECTED
        console.error("Penyebab Database Rejected:", error.code, error.message);
        alert("Firestore Error: " + error.message); 
    });
}


// 4. AUTHENTICATION & INITIALIZATION
onAuthStateChanged(auth, async (user) => {
    let overlay = document.getElementById('auth-overlay');
    const mainContent = document.getElementById('main-content');
    const chatBox = document.getElementById('chat-box');

    if (user) {
        if (overlay) overlay.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        document.body.style.overflow = 'auto';
        
        // Render Indikator Status jika belum ada
        if (chatBox && !document.getElementById('mizu-status')) {
    const statusWrapper = document.createElement('div');
    statusWrapper.className = 'status-container';
    statusWrapper.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
            <div id="mizu-status" class="status-indicator status-online">
                <span class="status-dot"></span> Mizu Online
            </div>
            <div style="font-size: 9px; color: #aaa; font-weight: 600; margin-left: 5px; letter-spacing: 0.3px;">
                Powered by <span style="color: #f55036;">Groq AI</span>
            </div>
        </div>
        <div style="font-size: 10px; color: #999; font-weight: bold; opacity: 0.7;">REAL-TIME SYNC</div>
    `;
    chatBox.parentNode.insertBefore(statusWrapper, chatBox);
    listenToMizuStatus(); 
        }

        await syncUserLimit(user);
        await loadUserHistory(); 
    } else {
        if (!overlay) overlay = createAuthUI();
        overlay.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
        document.body.style.overflow = 'hidden';
    }
});

function createAuthUI() {
    const existing = document.getElementById('auth-overlay');
    if (existing) return existing;

    const div = document.createElement('div');
    div.id = 'auth-overlay';
    div.innerHTML = `
        <h1 style="color:#BC002D; margin-bottom: 5px;">Fallen Mizu</h1>
        <p style="margin-bottom: 20px; opacity: 0.8;">Architectural AI With Zen</p>
        <div id="admin-login-area" style="width: 280px; display: flex; flex-direction: column; gap: 10px;">
            <input type="email" id="admin-email" placeholder="Admin Email" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            <input type="password" id="admin-password" placeholder="Password" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            <button id="admin-login-btn" style="background: #222; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold;">Login as Admin</button>
        </div>
        <div style="margin: 20px 0; color: #888; font-size: 14px; display: flex; align-items: center; gap: 10px;">
            <hr style="width: 50px; border: 0.5px solid #eee;"> Not an admin? <hr style="width: 50px; border: 0.5px solid #eee;">
        </div>
        <button class="google-btn" id="login-trigger">Sign in with Google</button>
        <div style="position: absolute; bottom: 30px; width: 100%; text-align: center; font-size: 10px; color: #bbb; letter-spacing: 1px;">
            © 2025 - 2026 FALLEN_MIZU. ALL RIGHTS RESERVED.
        </div>
    `;
    document.body.appendChild(div);

    document.getElementById('login-trigger').onclick = () => signInWithPopup(auth, provider);
    document.getElementById('admin-login-btn').onclick = async () => {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        if (!email || !password) return alert("Fields cannot be empty.");
        try {
            const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
            await signInWithEmailAndPassword(auth, email, password);
        } catch (e) { alert("Login failed: " + e.message); }
    };
    return div;
}

// 5. DATABASE LOGIC
async function syncUserLimit(user) {
    const today = new Date().toDateString();
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists() || snap.data().lastReset !== today) {
        await setDoc(userRef, { email: user.email, usageCount: 0, lastReset: today, isPremium: false, chatHistory: [] }, { merge: true });
    } else if (snap.data().usageCount >= DAILY_LIMIT && !snap.data().isPremium) {
        applyLock();
    }
}

async function saveToFirestore(role, text) {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    let history = snap.exists() ? (snap.data().chatHistory || []) : [];
    history.push({ role, text, timestamp: Date.now() });
    if (history.length > 30) history = history.slice(-30);
    await updateDoc(userRef, { chatHistory: history });
}

async function loadUserHistory() {
    const user = auth.currentUser;
    const chatBox = document.getElementById('chat-box');
    if (!user || !chatBox) return;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().chatHistory) {
        chatBox.innerHTML = "";
        snap.data().chatHistory.forEach(item => {
            renderRow(item.role, item.text, null, item.timestamp);
        });
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

// 6. CHAT LOGIC
window.sendMessage = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const statusRef = doc(db, "system", "status");

    try {
        // Cek Status Global
        const statusSnap = await getDoc(statusRef);
        const isOnline = statusSnap.exists() ? statusSnap.data().isOnline : true;
        if (!isOnline) {
            renderRow('mizu', "I am currently offline for maintenance. Please wait.");
            return;
        }

        // Cek Limit User
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.data().usageCount >= DAILY_LIMIT && !snap.data().isPremium) return applyLock();

        const input = document.getElementById('user-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        renderRow('user', text);
        await saveToFirestore('user', text);

        const loadId = "loading-" + Date.now();
        renderRow('mizu', 'Mizu is thinking...', loadId);

        const freshSnap = await getDoc(userRef);
        const historyForAI = freshSnap.data().chatHistory || [];

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: historyForAI })
        });

        if (!response.ok) {
            // Update Firestore ke Offline jika API mati
            await updateDoc(statusRef, { isOnline: false });
            throw new Error("Offline");
        }

        const data = await response.json();
        document.getElementById(loadId)?.remove();
        await renderTypingEffect('mizu', data.reply || "Mizu is offline.");
        await updateDoc(userRef, { usageCount: increment(1) });

        } catch (err) {
        const loaders = document.querySelectorAll('[id^="loading-"]');
        loaders.forEach(l => l.remove());
        
        console.error("DETEKSI ERROR:", err);

        // Jika ini adalah error API (response tidak ok)
        if (err.message === "Offline" || err.message === "API_ERROR") {
            // Coba paksa update Firestore, jika gagal tampilkan di console
            updateDoc(statusRef, { isOnline: false })
                .then(() => console.log("Status berhasil diubah ke Offline secara otomatis"))
                .catch((fErr) => console.error("Gagal mengubah status ke Firestore: ", fErr));
            
            renderRow('mizu', "System exhausted. Mizu will be back soon.");
        } else {
            // Jika error karena jaringan/firestore sendiri
            renderRow('mizu', "Connection error or Database rejected. Check console (F12).");
        }
    }
    
};

window.newChat = async () => {
    if (confirm("Mizu will forget this conversation forever. Reset memory?")) {
        const user = auth.currentUser;
        if (user) {
            await updateDoc(doc(db, "users", user.uid), { chatHistory: [] });
        }
        document.getElementById('chat-box').innerHTML = "";
        renderRow('mizu', "Memory cleared. How can I help you today?");
    }
};

/// 7. RENDERING ENGINE
function renderRow(role, text, id = null, timestamp = null) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    const row = document.createElement('div');
    row.className = `chat-row ${role}-row`;
    if (id) row.id = id;
    const bubble = document.createElement('div');
    bubble.className = `bubble ${role}-bubble`;
    
    const content = document.createElement('div');
    content.innerHTML = (typeof marked !== 'undefined') ? marked.parse(text) : text;

    // --- LOGIKA TOMBOL COPY ---
    content.querySelectorAll('pre').forEach(pre => {
        const container = document.createElement('div');
        container.className = 'code-container';
        pre.parentNode.insertBefore(container, pre);
        container.appendChild(pre);

        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.innerText = 'Copy';
        container.appendChild(button);

        button.addEventListener('click', () => {
            const code = pre.querySelector('code')?.innerText || pre.innerText;
            navigator.clipboard.writeText(code).then(() => {
                button.innerText = 'Copied!';
                button.classList.add('copied');
                setTimeout(() => {
                    button.innerText = 'Copy';
                    button.classList.remove('copied');
                }, 2000);
            });
        });
    });
    // ---------------------------

    const meta = document.createElement('div');
    meta.style.cssText = "display:flex; justify-content:flex-end; font-size:10px; opacity:0.6; margin-top:5px; gap:4px;";
    meta.innerHTML = `<span>${getJapanTime(timestamp)}</span>`;
    
    if (role === "user") { meta.innerHTML += `<span class="tick">✓✓</span>`; }
    bubble.appendChild(content);
    bubble.appendChild(meta);
    row.appendChild(bubble);
    chatBox.appendChild(row);
    
    if (typeof hljs !== 'undefined') row.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
    chatBox.scrollTop = chatBox.scrollHeight;
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
    const currentTimestamp = Date.now();

    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            if (i < fullText.length) {
                const currentText = fullText.substring(0, i + 1);
                messageDiv.innerHTML = (typeof marked !== 'undefined') ? marked.parse(currentText) : currentText;
                messageDiv.appendChild(cursor);
                i++;
                chatBox.scrollTop = chatBox.scrollHeight;
            } else {
                clearInterval(interval);
                messageDiv.querySelectorAll('pre').forEach(pre => {
    if (pre.parentElement.className === 'code-container') return;
    const container = document.createElement('div');
    container.className = 'code-container';
    pre.parentNode.insertBefore(container, pre);
    container.appendChild(pre);
    const button = document.createElement('button');
    button.className = 'copy-btn';
    button.innerText = 'Copy';
    container.appendChild(button);
    button.onclick = () => {
        const code = pre.querySelector('code')?.innerText || pre.innerText;
        navigator.clipboard.writeText(code);
        button.innerText = 'Copied!';
        setTimeout(() => button.innerText = 'Copy', 2000);
    };
});
                cursor.remove();
                const meta = document.createElement('div');
                meta.style.cssText = "display:flex; justify-content:flex-end; font-size:10px; opacity:0.6; margin-top:5px;";
                meta.innerHTML = `<span>${getJapanTime(currentTimestamp)}</span>`;
                bubble.appendChild(meta);
                if (typeof hljs !== 'undefined') row.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
                await saveToFirestore(role, fullText);
                resolve();
            }
        }, 15);
    });
}

// 8. LOGOUT & DOM EVENTS
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input');
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.sendMessage(); });

    // Tambahkan Event Listener Logout secara dinamis
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            if (confirm("Logout now?")) {
                try {
                    await signOut(auth);
                    window.location.reload();
                } catch (e) { alert("Error: " + e.message); }
            }
        };
    }
});
      
