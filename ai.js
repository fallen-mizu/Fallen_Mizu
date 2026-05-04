// 0. UTILS
function getJapanTime() {
    const now = new Date();
    const hours = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour: "numeric", hour12: true });
    const minutes = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", minute: "2-digit" });
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

// 2. UI STYLES
const style = document.createElement('style');
style.innerHTML = `
    #profile-panel { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 320px; background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 10000; display: none; }
    .profile-input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
    .btn-verify { background: #222; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 10px; }
    .username-warning { color: #BC002D; font-size: 11px; margin-top: -5px; display: none; }
    
    #chat-box { display: flex; flex-direction: column; padding: 15px; gap: 15px; overflow-y: auto; height: 400px; scroll-behavior: smooth; }
    .chat-row { display: flex; width: 100%; margin-bottom: 5px; }
    .mizu-row { justify-content: flex-start; }
    .user-row { justify-content: flex-end; }
    .bubble { padding: 12px 16px; max-width: 85%; font-size: 14px; border-radius: 18px; line-height: 1.6; position: relative; }
    .mizu-bubble { background: #f0f0f0; color: #222; border-bottom-left-radius: 4px; }
    .user-bubble { background: #BC002D; color: #fff; border-bottom-right-radius: 4px; }
    .bubble pre { background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 8px; overflow-x: auto; margin: 10px 0; border: 1px solid #333; }
    .bubble code { font-family: 'Fira Code', monospace; font-size: 0.85rem; }
    .typing-cursor { display: inline-block; width: 7px; height: 15px; background: #BC002D; margin-left: 5px; animation: blink 0.8s infinite; vertical-align: middle; }
    @keyframes blink { 50% { opacity: 0; } }
    #auth-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999; }
    .google-btn { background: #4285F4; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .limit-banner { background: #fee2e2; color: #b91c1c; padding: 10px; border-radius: 8px; text-align: center; font-weight: bold; border: 1px solid #f87171; }
`;
document.head.appendChild(style);

// 3. AUTHENTICATION & INITIALIZATION
onAuthStateChanged(auth, async (user) => {
    const overlay = document.getElementById('auth-overlay');
    const mainContent = document.getElementById('main-content');
    
    // Target tombol baru
    const floatingUserImg = document.getElementById('floating-user-img');
    const floatingUserName = document.getElementById('floating-user-name');

    if (user) {
        if (overlay) overlay.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        document.body.style.overflow = 'auto';
        
        // --- BAGIAN UPDATE TAMPILAN PROFIL ---
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        
        // 1. Tampilkan Foto Profil Google (jika ada)
        if (floatingUserImg && user.photoURL) {
            floatingUserImg.src = user.photoURL;
        } else if (floatingUserImg) {
            // Default jika tidak ada foto
            floatingUserImg.src = "https://www.transparenttextures.com/patterns/handmade-paper.png"; 
        }

        // 2. Tampilkan Username (Cek Firestore dulu, kalau kosong pakai nama Google)
        if (snap.exists() && snap.data().username) {
            if (floatingUserName) floatingUserName.innerText = snap.data().username;
        } else if (floatingUserName) {
            if (user.displayName) {
                // Ambil nama depan saja biar ringkas
                floatingUserName.innerText = user.displayName.split(' ')[0];
            } else {
                floatingUserName.innerText = "Mizu";
            }
        }
        // ------------------------------------

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

// 4. DATABASE & STORAGE LOGIC
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
        snap.data().chatHistory.forEach(item => renderRow(item.role, item.text));
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
function renderRow(role, text, id = null) {
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
    meta.innerHTML = `<span>${getJapanTime()}</span>`;
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
                meta.innerHTML = `<span>${getJapanTime()}</span>`;
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
          
// --- SISTEM PROFIL SIMPEL (USERNAME ONLY) ---

// Fungsi Cek Username & Simpan
document.getElementById('btn-save-profile').onclick = async () => {
    const user = auth.currentUser;
    const newUsername = document.getElementById('prof-username').value.trim();
    const msgArea = document.getElementById('username-msg');

    if (!newUsername || newUsername.length < 3) {
        msgArea.innerText = "Username too short (min 3 chars).";
        msgArea.style.display = "block";
        return;
    }

    try {
        // Cek apakah username sudah dipakai orang lain di Firestore
        const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const q = query(collection(db, "users"), where("username", "==", newUsername));
        const querySnapshot = await getDocs(q);

        // Jika ada user lain (bukan kita) yang pakai username tersebut
        let isTaken = false;
        querySnapshot.forEach((doc) => {
            if (doc.id !== user.uid) isTaken = true;
        });

        if (isTaken) {
            const suggestion = newUsername + Math.floor(Math.random() * 99);
            msgArea.innerHTML = `Username already taken.<br>Try: <strong>${suggestion}</strong>`;
            msgArea.style.display = "block";
            return;
        }

        // Jika aman, update di Firestore
            if (!isTaken) {
        await updateDoc(doc(db, "users", user.uid), {
            username: newUsername
        });

        // Update tampilan secara instan
        document.querySelector('h1 span').innerText = newUsername;
        msgArea.style.display = "none";
        alert("Profile updated successfully!");
        const floatingUserName = document.getElementById('floating-user-name');
        if (floatingUserName) floatingUserName.innerText = newUsername;

        msgArea.style.display = "none";
        alert("Username updated!");
        document.getElementById('profile-panel').style.display = 'none';

    } catch (e) {
        console.error(e);
        alert("Error: " + e.message);
    }
};

// Event Klik Foto Profil untuk Buka Panel
  document.addEventListener('click', (e) => {
    // Jika tombol floating profil diklik
    if (e.target.closest('#floating-profile-btn')) {
        const panel = document.getElementById('profile-panel');
        const userNameSpan = document.getElementById('floating-user-name');
        
        if (panel) panel.style.display = 'block';
        if (userNameSpan) {
            // Isi input edit dengan nama yang sekarang
            document.getElementById('prof-username').value = userNameSpan.innerText;
        }
    }
});
