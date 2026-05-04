// --- 1. CONFIG & INITIALIZATION ---
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

// --- 2. SETTINGS ---
const DAILY_LIMIT = 30;
const ADMIN_EMAILS = ["fallenmizu@admin.com"]; // Pastikan huruf kecil semua di sini
const WHATSAPP_LINK = "https://wa.me/message/7HHZHXNC5EVRB1";

// --- 3. AUTH STATE & UI SYNC ---
onAuthStateChanged(auth, async (user) => {
    const overlay = document.getElementById('auth-overlay');
    const mainContent = document.getElementById('main-content');
    const chatBox = document.getElementById('chat-box');

    if (user) {
        if (overlay) overlay.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        document.body.style.overflow = 'auto';

        // Cek Admin
        const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
        console.log("Logged in as:", user.email, "| Admin Access:", isAdmin);

        // Render Status Bar (Hanya jika belum ada)
        if (chatBox && !document.getElementById('mizu-status-wrapper')) {
            const statusWrapper = document.createElement('div');
            statusWrapper.id = 'mizu-status-wrapper';
            statusWrapper.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px 15px; background:#fff; border-bottom:1px solid #eee; margin-bottom:10px; border-radius:10px;";
            
            statusWrapper.innerHTML = `
                <div id="mizu-status" class="status-indicator status-online">
                    <span class="status-dot"></span> Mizu Online
                </div>
                ${isAdmin ? `
                    <button id="force-online-btn" style="font-size: 10px; background: #000; color: #fff; border: none; padding: 5px 12px; border-radius: 20px; cursor: pointer; font-weight: bold;">
                        FORCE ONLINE
                    </button>
                ` : `<div style="font-size: 9px; color: #999; letter-spacing:1px;">REAL-TIME SYNC</div>`}
            `;
            chatBox.parentNode.insertBefore(statusWrapper, chatBox);

            if (isAdmin) {
                document.getElementById('force-online-btn').onclick = async () => {
                    try {
                        await updateDoc(doc(db, "system", "status"), { isOnline: true });
                        alert("System Forced Online!");
                    } catch (e) { alert("Error: " + e.message); }
                };
            }
            listenToMizuStatus();
        }

        await syncUserLimit(user);
        await loadUserHistory();
    } else {
        if (mainContent) mainContent.style.display = 'none';
        showLoginOverlay();
    }
});

// --- 4. CORE FUNCTIONS ---
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

function listenToMizuStatus() {
    onSnapshot(doc(db, "system", "status"), (docSnap) => {
        const el = document.getElementById('mizu-status');
        if (!el || !docSnap.exists()) return;
        const isOnline = docSnap.data().isOnline;
        el.className = `status-indicator ${isOnline ? 'status-online' : 'status-offline'}`;
        el.innerHTML = `<span class="status-dot"></span> Mizu ${isOnline ? 'Online' : 'Offline'}`;
    });
}

window.sendMessage = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const statusRef = doc(db, "system", "status");
    const statusSnap = await getDoc(statusRef);
    if (statusSnap.exists() && !statusSnap.data().isOnline) {
        return renderRow('mizu', "I am currently offline. Please wait.");
    }

    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    renderRow('user', text);
    
    const loadId = "loading-" + Date.now();
    renderRow('mizu', 'Thinking...', loadId);

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: userSnap.data().chatHistory || [] })
        });

        document.getElementById(loadId)?.remove();

        if (!response.ok) {
            await updateDoc(statusRef, { isOnline: false });
            throw new Error("Limit");
        }

        const data = await response.json();
        await renderTypingEffect('mizu', data.reply);
        await updateDoc(userRef, { 
            usageCount: increment(1),
            chatHistory: [...(userSnap.data().chatHistory || []).slice(-10), { role: 'user', text }, { role: 'mizu', text: data.reply }]
        });
    } catch (err) {
        document.getElementById(loadId)?.remove();
        renderRow('mizu', "System exhausted. Mizu will be back soon.");
    }
};

window.newChat = async () => {
    if (confirm("Reset conversation?")) {
        const user = auth.currentUser;
        if (user) await updateDoc(doc(db, "users", user.uid), { chatHistory: [] });
        document.getElementById('chat-box').innerHTML = "";
        renderRow('mizu', "Memory cleared. How can I help?");
    }
};

// --- 5. UI RENDERING ---
function renderRow(role, text, id = null) {
    const chatBox = document.getElementById('chat-box');
    const row = document.createElement('div');
    row.className = `chat-row ${role}-row`;
    if (id) row.id = id;
    row.innerHTML = `<div class="bubble ${role}-bubble">${marked.parse(text)}</div>`;
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function renderTypingEffect(role, fullText) {
    const chatBox = document.getElementById('chat-box');
    const row = document.createElement('div');
    row.className = `chat-row ${role}-row`;
    const bubble = document.createElement('div');
    bubble.className = `bubble ${role}-bubble`;
    row.appendChild(bubble);
    chatBox.appendChild(row);

    let i = 0;
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (i < fullText.length) {
                bubble.innerHTML = marked.parse(fullText.substring(0, i + 1));
                i++;
                chatBox.scrollTop = chatBox.scrollHeight;
            } else {
                clearInterval(interval);
                resolve();
            }
        }, 20);
    });
}

function applyLock() {
    const input = document.getElementById('user-input');
    if (input) { input.disabled = true; input.placeholder = "Daily limit reached."; }
}

// --- 6. LOGOUT & AUTH UI ---
function showLoginOverlay() {
    let overlay = document.getElementById('auth-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'auth-overlay';
        overlay.innerHTML = `
            <div style="text-align:center; background:#fff; padding:40px; border-radius:20px;">
                <h2 style="color:#BC002D">Fallen Mizu</h2>
                <button id="google-login" style="background:#4285F4; color:#fff; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">Login with Google</button>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('google-login').onclick = () => signInWithPopup(auth, provider);
    }
    overlay.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
    // Event listener untuk logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            if (confirm("Logout?")) {
                await signOut(auth);
                window.location.reload();
            }
        };
    }
    // Event listener untuk Enter key
    const input = document.getElementById('user-input');
    if (input) input.onkeypress = (e) => { if (e.key === 'Enter') window.sendMessage(); };
});
      
