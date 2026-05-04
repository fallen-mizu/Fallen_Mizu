import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. CONFIGURATION - Replace with your own data from Firebase Console
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
const WHATSAPP_LINK = "https://wa.me/+817094251640";

// 2. UI STYLES
const style = document.createElement('style');
style.innerHTML = `
    #chat-box { display: flex; flex-direction: column; padding: 15px; gap: 15px; overflow-y: auto; height: 400px; }
    .chat-row { display: flex; width: 100%; }
    .mizu-row { justify-content: flex-start; }
    .user-row { justify-content: flex-end; }
    .bubble { padding: 10px 15px; max-width: 80%; font-size: 14px; border-radius: 15px; }
    .mizu-bubble { background: #f1f1f1; color: #333; border-bottom-left-radius: 2px; }
    .user-bubble { background: #BC002D; color: #fff; border-bottom-right-radius: 2px; }
    #auth-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999; font-family: sans-serif; }
    .google-btn { background: #4285F4; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .limit-banner { background: #fee2e2; color: #b91c1c; padding: 10px; border-radius: 8px; text-align: center; font-weight: bold; margin-bottom: 10px; border: 1px solid #f87171; }
`;
document.head.appendChild(style);

// 3. AUTHENTICATION HANDLER
onAuthStateChanged(auth, async (user) => {
    let overlay = document.getElementById('auth-overlay');
    if (!overlay) overlay = createAuthUI();

    if (user) {
        overlay.style.display = 'none';
        await syncUserLimit(user);

        // 🔥 CEK APAKAH CHAT SUDAH DI CLEAR
        if (localStorage.getItem("mizu_cleared") === "true") {
            localStorage.removeItem("mizu_history");
            localStorage.removeItem("mizu_cleared");
            document.getElementById("chat-box").innerHTML = "";
            return; // ⛔ STOP supaya tidak load ulang
        }

        loadLocalHistory();

    } else {
        overlay.style.display = 'flex';
    }
});

function createAuthUI() {
    const div = document.createElement('div');
    div.id = 'auth-overlay';
    div.innerHTML = `
        <h1 style="color:#BC002D">Fallen Mizu</h1>
        <p>Architectural AI Assistant</p>
        <button class="google-btn" id="login-trigger">Sign in with Google</button>
    `;
    document.body.appendChild(div);
    document.getElementById('login-trigger').onclick = () => signInWithPopup(auth, provider);
    return div;
}

// 4. LIMIT & DATABASE LOGIC
async function syncUserLimit(user) {
    const today = new Date().toDateString();
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists() || snap.data().lastReset !== today) {
        await setDoc(userRef, {
            email: user.email,
            usageCount: 0,
            lastReset: today,
            isPremium: false
        }, { merge: true });
    } else if (snap.data().usageCount >= DAILY_LIMIT && !snap.data().isPremium) {
        applyLock();
    }
}

function applyLock() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    if (!document.getElementById('limit-banner')) {
        const banner = document.createElement('div');
        banner.id = 'limit-banner';
        banner.className = 'limit-banner';
        banner.innerHTML = `Limit reached! <a href="${WHATSAPP_LINK}" target="_blank" style="color:inherit; text-decoration:underline;">Subscribe for Unlimited</a>`;
        chatBox.prepend(banner);
    }
    if (input) {
        input.disabled = true;
        input.placeholder = "Daily limit reached...";
    }
}

// 5. CHAT FUNCTIONALITY
window.sendMessage = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (snap.data().usageCount >= DAILY_LIMIT && !snap.data().isPremium) return applyLock();

    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    renderRow('user', text);
    saveLocal('user', text);

    const loadId = "loading-" + Date.now();
    renderRow('mizu', 'Mizu is thinking...', loadId);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });

        const data = await response.json();
        document.getElementById(loadId).remove();

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu is offline.";
        renderRow('mizu', reply);
        saveLocal('mizu', reply);

        // Update limit in Firebase
        await updateDoc(userRef, { usageCount: increment(1) });
        
    } catch (err) {
        document.getElementById(loadId).innerText = "Connection error.";
    }
};

// 6. UTILS
function renderRow(role, text, id = null) {
    const chatBox = document.getElementById('chat-box');
    const row = document.createElement('div');
    row.className = `chat-row ${role}-row`;
    if (id) row.id = id;
    row.innerHTML = `<div class="bubble ${role}-bubble">${text}</div>`;
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function saveLocal(role, text) {
    let history = JSON.parse(localStorage.getItem('mizu_history')) || [];
    history.push({ role, text });
    localStorage.setItem('mizu_history', JSON.stringify(history.slice(-15)));
}

function loadLocalHistory() {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;

    chatBox.innerHTML = ""; // 🔥 reset dulu

    const history = JSON.parse(localStorage.getItem('mizu_history')) || [];
    history.forEach(item => renderRow(item.role, item.text));
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input');
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.sendMessage(); });
});

            
