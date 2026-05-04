// 0. UTILS - Format Jam Jepang (Tokyo Time)
function getJapanTime() {
    const options = {
        timeZone: "Asia/Tokyo",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    };
    const formatter = new Intl.DateTimeFormat("ja-JP", options);
    // Ini akan menghasilkan format seperti 午後 10:30 atau 午前 8:15
    return formatter.format(new Date());
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 2. AUTHENTICATION & PROFILE LOGIC
onAuthStateChanged(auth, async (user) => {
    let overlay = document.getElementById('auth-overlay');
    const mainContent = document.getElementById('main-content');
    const floatingImg = document.getElementById('floating-user-img');
    const floatingName = document.getElementById('floating-user-name');

    if (user) {
        if (overlay) overlay.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        document.body.style.overflow = 'auto';
        
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        
        if (floatingImg) floatingImg.src = user.photoURL || "";
        
        if (snap.exists() && snap.data().username) {
            if (floatingName) floatingName.innerText = snap.data().username;
        } else {
            if (floatingName) floatingName.innerText = user.displayName ? user.displayName.split(' ')[0] : "User";
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
    let div = document.getElementById('auth-overlay');
    if (!div) {
        div = document.createElement('div');
        div.id = 'auth-overlay';
        div.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999;";
        div.innerHTML = `<h1 style="color:#BC002D; margin-bottom: 5px;">Fallen Mizu</h1><p style="margin-bottom: 20px; opacity: 0.8;">Architectural AI With Zen</p><button id="login-trigger" style="background:#4285F4; color:white; border:none; padding:12px 24px; border-radius:5px; cursor:pointer; font-weight:bold;">Sign in with Google</button>`;
        document.body.appendChild(div);
        document.getElementById('login-trigger').onclick = () => signInWithPopup(auth, provider);
    }
    return div;
}

// 3. DATABASE LOGIC
async function syncUserLimit(user) {
    const today = new Date().toDateString();
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists() || snap.data().lastReset !== today) {
        await setDoc(userRef, { email: user.email, usageCount: 0, lastReset: today, chatHistory: [] }, { merge: true });
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

// 4. CHAT FUNCTIONS
window.sendMessage = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    renderRow('user', text);
    await saveToFirestore('user', text);

    const loadId = "loading-" + Date.now();
    renderRow('mizu', 'Thinking...', loadId);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, userEmail: user.email })
        });
        const data = await response.json();
        document.getElementById(loadId)?.remove();
        await renderTypingEffect('mizu', data.reply || "Mizu is offline.");
    } catch (err) {
        console.error(err);
    }
};

// 5. RENDERING ENGINE (BUBBLE CHAT VERSION)
function renderRow(role, text, id = null) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;

    const row = document.createElement('div');
    row.className = `chat-row ${role}-row`;
    if (id) row.id = id;

    const bubble = document.createElement('div');
    bubble.className = `bubble ${role}-bubble`;
    
    // Gunakan Marked.js jika ada, jika tidak gunakan text biasa
    const content = (typeof marked !== 'undefined') ? marked.parse(text) : text;
    
    bubble.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-meta" style="display:flex; justify-content:flex-end; font-size:10px; opacity:0.6; margin-top:5px; gap:4px;">
            <span>${getJapanTime()}</span>
            ${role === 'user' ? '<span>✓✓</span>' : ''}
        </div>
    `;

    row.appendChild(bubble);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function renderTypingEffect(role, fullText) {
    const chatBox = document.getElementById('chat-box');
    const row = document.createElement('div');
    row.className = `chat-row ${role}-row`;
    
    const bubble = document.createElement('div');
    bubble.className = `bubble ${role}-bubble`;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = "message-content";
    bubble.appendChild(msgDiv);
    
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    bubble.appendChild(cursor);
    
    row.appendChild(bubble);
    chatBox.appendChild(row);

    let i = 0;
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (i < fullText.length) {
                const currentText = fullText.substring(0, i + 1);
                msgDiv.innerHTML = (typeof marked !== 'undefined') ? marked.parse(currentText) : currentText;
                i++;
                chatBox.scrollTop = chatBox.scrollHeight;
            } else {
                clearInterval(interval);
                cursor.remove();
                
                // Tambahkan Meta Jam setelah selesai mengetik
                const meta = document.createElement('div');
                meta.style.cssText = "display:flex; justify-content:flex-end; font-size:10px; opacity:0.6; margin-top:5px;";
                meta.innerHTML = `<span>${getJapanTime()}</span>`;
                bubble.appendChild(meta);
                
                saveToFirestore(role, fullText);
                resolve();
            }
        }, 20);
    });
}

// 6. PROFILE & LOGOUT EVENTS
document.addEventListener('click', async (e) => {
    if (e.target.closest('#floating-profile-btn')) {
        document.getElementById('profile-panel').style.display = 'block';
        document.getElementById('prof-username').value = document.getElementById('floating-user-name').innerText;
    }
});

const btnSave = document.getElementById('btn-save-profile');
if (btnSave) {
    btnSave.onclick = async () => {
        const user = auth.currentUser;
        const newUsername = document.getElementById('prof-username').value.trim();
        const msgArea = document.getElementById('username-msg');
        if (newUsername.length < 3) return;

        try {
            const q = query(collection(db, "users"), where("username", "==", newUsername));
            const snap = await getDocs(q);
            let isTaken = false;
            snap.forEach(d => { if(d.id !== user.uid) isTaken = true; });

            if (isTaken) {
                msgArea.innerText = "Taken! Try: " + newUsername + Math.floor(Math.random()*99);
                msgArea.style.display = "block";
            } else {
                await updateDoc(doc(db, "users", user.uid), { username: newUsername });
                document.getElementById('floating-user-name').innerText = newUsername;
                document.getElementById('profile-panel').style.display = 'none';
                alert("Success!");
            }
        } catch (e) { alert(e.message); }
    };
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        if (confirm("Logout?")) {
            await signOut(auth);
            window.location.reload();
        }
    };
}

// Tambahkan support enter key
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input');
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.sendMessage(); });
});
  
