// 0. UTILS
function getJapanTime() {
    const now = new Date();
    const hours = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour: "numeric", hour12: true });
    const minutes = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", minute: "2-digit" });
    return hours.replace("時", "") + ":" + minutes;
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

const DAILY_LIMIT = 30;

// 2. AUTHENTICATION & PROFILE UI LOGIC
onAuthStateChanged(auth, async (user) => {
    let overlay = document.getElementById('auth-overlay');
    const mainContent = document.getElementById('main-content');
    const floatingImg = document.getElementById('floating-user-img');
    const floatingName = document.getElementById('floating-user-name');

    if (user) {
        if (overlay) overlay.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        document.body.style.overflow = 'auto';
        
        // Ambil Data Profil
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        
        // Update Floating Button
        if (floatingImg) floatingImg.src = user.photoURL || "https://www.transparenttextures.com/patterns/handmade-paper.png";
        
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
    const div = document.createElement('div');
    div.id = 'auth-overlay';
    div.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999;";
    div.innerHTML = `
        <h1 style="color:#BC002D; margin-bottom: 5px;">Fallen Mizu</h1>
        <p style="margin-bottom: 20px; opacity: 0.8;">Architectural AI With Zen</p>
        <button id="login-trigger" style="background:#4285F4; color:white; border:none; padding:12px 24px; border-radius:5px; cursor:pointer; font-weight:bold;">Sign in with Google</button>
    `;
    document.body.appendChild(div);
    document.getElementById('login-trigger').onclick = () => signInWithPopup(auth, provider);
    return div;
}

// 3. DATABASE LOGIC (LIMIT & HISTORY)
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
        await renderTypingEffect('mizu', data.reply || "Offline.");
        await updateDoc(doc(db, "users", user.uid), { usageCount: increment(1) });
    } catch (err) {
        console.error(err);
    }
};

// 5. RENDERING ENGINE
function renderRow(role, text, id = null) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    const row = document.createElement('div');
    row.className = `chat-row ${role}-row`;
    if (id) row.id = id;
    const bubble = document.createElement('div');
    bubble.className = `bubble ${role}-bubble`;
    bubble.innerHTML = text;
    row.appendChild(bubble);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function renderTypingEffect(role, fullText) {
    renderRow(role, fullText);
    await saveToFirestore(role, fullText);
}

// 6. PROFILE PANEL & USERNAME LOGIC
document.addEventListener('click', async (e) => {
    // Buka Panel saat klik tombol floating
    if (e.target.closest('#floating-profile-btn')) {
        document.getElementById('profile-panel').style.display = 'block';
        document.getElementById('prof-username').value = document.getElementById('floating-user-name').innerText;
    }
});

const btnSaveProfile = document.getElementById('btn-save-profile');
if (btnSaveProfile) {
    btnSaveProfile.onclick = async () => {
        const user = auth.currentUser;
        const newUsername = document.getElementById('prof-username').value.trim();
        const msgArea = document.getElementById('username-msg');

        if (newUsername.length < 3) {
            msgArea.innerText = "Too short!";
            msgArea.style.display = "block";
            return;
        }

        try {
            // Cek Duplikat
            const q = query(collection(db, "users"), where("username", "==", newUsername));
            const snap = await getDocs(q);
            let isTaken = false;
            snap.forEach(d => { if(d.id !== user.uid) isTaken = true; });

            if (isTaken) {
                msgArea.innerText = "Already taken! Try: " + newUsername + Math.floor(Math.random()*99);
                msgArea.style.display = "block";
            } else {
                await updateDoc(doc(db, "users", user.uid), { username: newUsername });
                document.getElementById('floating-user-name').innerText = newUsername;
                alert("Updated!");
                document.getElementById('profile-panel').style.display = 'none';
            }
        } catch (err) { alert(err.message); }
    };
}

// 7. LOGOUT LOGIC
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        if (confirm("Logout?")) {
            await signOut(auth);
            window.location.reload();
        }
    };
  }
          
