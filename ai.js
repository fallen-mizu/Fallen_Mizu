// 0. UTILS
function getJapanTime(timestamp = null) {
    const date = timestamp ? new Date(timestamp) : new Date();
    const hours = date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour: "numeric", hour12: true });
    const minutes = date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", minute: "2-digit" });
    return hours.replace("時", "") + ":" + minutes;
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

// 2. UI STYLES (UPDATED FOR HEADER & HEIGHT)
const style = document.createElement('style');
style.innerHTML = `
    #main-content { 
        max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; 
        height: 92vh; border: 1px solid #ddd; background: #fff; border-radius: 15px; overflow: hidden;
    }
    .chat-header { 
        padding: 12px 16px; background: #fff; border-bottom: 1px solid #eee; 
        display: flex; align-items: center; gap: 12px; z-index: 10;
    }
    .mizu-avatar { width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 1px solid #eee; }
    .header-info { flex: 1; }
    .mizu-name { font-weight: bold; font-size: 16px; display: block; color: #222; }
    .mizu-status { font-size: 12px; font-weight: 500; }
    .status-online { color: #22c55e; }
    .status-offline { color: #ef4444; }

    #chat-box { flex: 1; display: flex; flex-direction: column; padding: 15px; gap: 15px; overflow-y: auto; background: #fdfdfd; scroll-behavior: smooth; }
    .chat-row { display: flex; width: 100%; margin-bottom: 5px; }
    .mizu-row { justify-content: flex-start; }
    .user-row { justify-content: flex-end; }
    .bubble { padding: 12px 16px; max-width: 85%; font-size: 14px; border-radius: 18px; line-height: 1.6; position: relative; }
    .mizu-bubble { background: #f0f0f0; color: #222; border-bottom-left-radius: 4px; }
    .user-bubble { background: #BC002D; color: #fff; border-bottom-right-radius: 4px; }
    
    .input-area { padding: 15px; border-top: 1px solid #eee; display: flex; gap: 10px; align-items: center; background: #fff; }
    #user-input { flex: 1; padding: 12px 20px; border-radius: 25px; border: 1px solid #ddd; outline: none; font-size: 14px; }
    
    .typing-cursor { display: inline-block; width: 7px; height: 15px; background: #BC002D; margin-left: 5px; animation: blink 0.8s infinite; vertical-align: middle; }
    @keyframes blink { 50% { opacity: 0; } }
    #auth-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999; }
    .google-btn { background: #4285F4; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .limit-banner { background: #fee2e2; color: #b91c1c; padding: 10px; border-radius: 8px; text-align: center; font-weight: bold; border: 1px solid #f87171; margin-bottom: 10px; }
`;
document.head.appendChild(style);

// 3. AUTHENTICATION & INITIALIZATION
onAuthStateChanged(auth, async (user) => {
    let overlay = document.getElementById('auth-overlay');
    const mainContent = document.getElementById('main-content');

    if (user) {
        if (overlay) overlay.style.display = 'none';
        if (mainContent) mainContent.style.display = 'flex';
        document.body.style.overflow = 'auto';
        
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

// 4. DATABASE & STORAGE LOGIC (UPDATED STATUS)
async function syncUserLimit(user) {
    const today = new Date().toDateString();
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const statusText = document.getElementById('mizu-status-text');

    if (!snap.exists() || snap.data().lastReset !== today) {
        await setDoc(userRef, { email: user.email, usageCount: 0, lastReset: today, isPremium: false, chatHistory: [] }, { merge: true });
        if(statusText) { statusText.innerText = "Online"; statusText.className = "mizu-status status-online"; }
    } else {
        const data = snap.data();
        if (data.usageCount >= DAILY_LIMIT && !data.isPremium) {
            applyLock();
            if(statusText) { statusText.innerText = "Offline"; statusText.className = "mizu-status status-offline"; }
        } else {
            if(statusText) { statusText.innerText = "Online"; statusText.className = "mizu-status status-online"; }
        }
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

// 5. CHAT LOGIC
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
    renderRow('user', text);
    await saveToFirestore('user', text);

    const loadId = "loading-" + Date.now();
    renderRow('mizu', 'Mizu is thinking...', loadId);

    try {
        const freshSnap = await getDoc(userRef);
        const historyForAI = freshSnap.data().chatHistory || [];

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: historyForAI })
        });

        const data = await response.json();
        document.getElementById(loadId)?.remove();
        const reply = data.reply || "Mizu is offline.";
        
        await renderTypingEffect('mizu', reply);
        await updateDoc(userRef, { usageCount: increment(1) });
        await syncUserLimit(user); // Re-check status after sending
    } catch (err) {
        if(document.getElementById(loadId)) document.getElementById(loadId).innerText = "Connection error.";
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

// 6. RENDERING ENGINE
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

// 7. LOGOUT & EVENTS
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input');
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.sendMessage(); });
});

window.handleLogout = async () => {
    if (confirm("Logout now?")) {
        try {
            await signOut(auth);
            window.location.reload();
        } catch (e) { alert("Error: " + e.message); }
    }
};

// INITIAL HTML SETUP FOR MAIN CONTENT (Run once)
const initUI = () => {
    const main = document.createElement('div');
    main.id = 'main-content';
    main.style.display = 'none';
    main.innerHTML = `
        <div class="chat-header">
            <img src="https://telegra.ph/file/0c918a3832c324151740d.jpg" class="mizu-avatar">
            <div class="header-info">
                <span class="mizu-name">Mizu</span>
                <span id="mizu-status-text" class="mizu-status status-online">Online</span>
            </div>
            <div style="display:flex; gap:15px; align-items:center;">
                <span style="cursor:pointer;" onclick="newChat()">🧹</span>
                <span style="cursor:pointer;" onclick="handleLogout()">🚪</span>
            </div>
        </div>
        <div id="chat-box"></div>
        <div class="input-area">
            <input type="text" id="user-input" placeholder="Ask Mizu anything...">
            <button onclick="sendMessage()" style="background:none; border:none; font-size:20px; cursor:pointer;">🕊️</button>
        </div>
    `;
    document.body.appendChild(main);
};
initUI();
  
