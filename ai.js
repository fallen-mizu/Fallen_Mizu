import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyAJDI39JipbKuDJ6YHO",
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

const DAILY_LIMIT = 5;
const WHATSAPP_LINK = "https://wa.me/+817094251640";

// 2. STYLES FOR MODAL
const style = document.createElement('style');
style.innerHTML = `
    .login-modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:10000; backdrop-filter: blur(8px); }
    .login-card { background: white; padding: 40px; border-radius: 24px; text-align: center; width: 85%; max-width: 380px; box-shadow: 0 25px 50px rgba(0,0,0,0.3); font-family: 'Inter', sans-serif; }
    .google-btn { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 14px; border: 1px solid #ddd; border-radius: 12px; background: white; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: 0.3s; }
    .google-btn:hover { background: #f9f9f9; transform: translateY(-2px); }
    .google-btn img { width: 20px; }
    .limit-banner { background: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 10px; text-align: center; font-weight: 700; margin-bottom: 15px; border: 1px solid #f87171; font-size: 0.75rem; }
`;
document.head.appendChild(style);

// 3. AUTH STATE MANAGEMENT
onAuthStateChanged(auth, async (user) => {
    const statusText = document.getElementById('user-status');
    const avatarImg = document.getElementById('user-avatar');
    const authBtn = document.getElementById('auth-btn');

    if (user) {
        statusText.textContent = user.displayName.split(' ')[0].toUpperCase();
        avatarImg.src = user.photoURL;
        authBtn.textContent = "LOGOUT";
        authBtn.onclick = () => signOut(auth);
        await syncUserLimit(user);
    } else {
        statusText.textContent = "GUEST";
        avatarImg.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        authBtn.textContent = "LOGIN";
        authBtn.onclick = () => showLoginModal();
    }
});

function showLoginModal() {
    if (document.querySelector('.login-modal-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'login-modal-overlay';
    overlay.innerHTML = `
        <div class="login-card">
            <h2 style="font-family: 'Noto Serif JP', serif; margin-bottom: 8px;">Fallen Mizu</h2>
            <p style="font-size: 0.8rem; color: #666; margin-bottom: 30px;">Sign in to unlock unlimited architectural consultation.</p>
            <button class="google-btn" id="trigger-google">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Reference_Logo.svg" alt="G">
                Continue with Google
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; background: none; border: none; color: #aaa; font-size: 0.75rem; cursor: pointer;">Maybe Later</button>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('trigger-google').onclick = () => {
        signInWithPopup(auth, provider).then(() => overlay.remove()).catch(err => alert("Login failed: " + err.message));
    };
}

// 4. DATABASE & LIMITS
async function syncUserLimit(user) {
    const today = new Date().toDateString();
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists() || snap.data().lastReset !== today) {
        await setDoc(userRef, { usageCount: 0, lastReset: today, isPremium: false }, { merge: true });
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
        banner.innerHTML = `Daily limit reached. <a href="${WHATSAPP_LINK}" target="_blank" style="color:inherit;">Upgrade to Premium</a>`;
        chatBox.prepend(banner);
    }
    if (input) { input.disabled = true; input.placeholder = "Limit reached..."; }
}

// 5. SEND MESSAGE LOGIC
window.sendMessage = async () => {
    const user = auth.currentUser;
    if (!user) return showLoginModal();

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (snap.data().usageCount >= DAILY_LIMIT && !snap.data().isPremium) return applyLock();

    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    appendMessage('User', text);
    const loadId = "msg-" + Date.now();
    appendMessage('Mizu', 'Thinking...', loadId);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await response.json();
        document.getElementById(loadId).remove();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu is silent.";
        appendMessage('Mizu', reply);
        await updateDoc(userRef, { usageCount: increment(1) });
    } catch (e) {
        document.getElementById(loadId).innerText = "Connection error.";
    }
};

function appendMessage(role, text, id = null) {
    const chatBox = document.getElementById('chat-box');
    const div = document.createElement('div');
    div.style.marginBottom = "12px";
    if (id) div.id = id;
    div.innerHTML = `<span style="font-weight:800; color:${role==='User'?'#888':'var(--wasabi-red)'}">${role.toUpperCase()}:</span> <span style="margin-left:8px;">${text}</span>`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    }
      
