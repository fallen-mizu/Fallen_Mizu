// ===============================
// MIZU CHAT SYSTEM (ChatGPT Style)
// ===============================

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

let isTyping = false;

// ===============================
// LOAD HISTORY (Auto Load)
// ===============================
function loadHistory() {
    const history = JSON.parse(localStorage.getItem("mizu_history")) || [];
    chatBox.innerHTML = "";

    history.forEach(item => {
        renderMessage(item.role, item.text, false);
    });

    scrollBottom();
}

// ===============================
// SAVE HISTORY
// ===============================
function saveHistory(role, text) {
    const history = JSON.parse(localStorage.getItem("mizu_history")) || [];
    history.push({ role, text });

    localStorage.setItem("mizu_history", JSON.stringify(history));
}

// ===============================
// RENDER MESSAGE
// ===============================
function renderMessage(role, text, save = true) {
    const msg = document.createElement("div");
    msg.className = "msg " + role;

    msg.innerText = text;

    chatBox.appendChild(msg);

    if (save) saveHistory(role, text);

    scrollBottom();
}

// ===============================
// TYPING EFFECT (AI)
// ===============================
function renderTyping(text) {
    const msg = document.createElement("div");
    msg.className = "msg bot";
    chatBox.appendChild(msg);

    let i = 0;
    isTyping = true;

    function type() {
        if (i < text.length) {
            msg.innerText += text.charAt(i);
            i++;
            scrollBottom();
            setTimeout(type, 15);
        } else {
            isTyping = false;
        }
    }

    type();
}

// ===============================
// SCROLL BOTTOM
// ===============================
function scrollBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ===============================
// SEND MESSAGE
// ===============================
async function sendMessage() {
    const text = input.value.trim();
    if (!text || isTyping) return;

    renderMessage("user", text);
    input.value = "";

    // loading placeholder
    const loading = document.createElement("div");
    loading.className = "msg bot";
    loading.innerText = "Mizu is thinking...";
    chatBox.appendChild(loading);
    scrollBottom();

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: text })
        });

        const data = await res.json();

        loading.remove();
        renderTyping(data.reply || "No response.");

    } catch (err) {
        loading.innerText = "⚠️ Mizu is offline.";
    }
}

// ===============================
// ENTER KEY SUPPORT
// ===============================
input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

sendBtn.addEventListener("click", sendMessage);

// ===============================
// CLEAR CHAT
// ===============================
function clearChat() {
    localStorage.removeItem("mizu_history");
    chatBox.innerHTML = "";
}

// ===============================
// INIT
// ===============================
loadHistory();
