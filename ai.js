// ai.js (Client Side)
const MIZU_API_URL = "/api/chat"; // Menuju ke file chat.js di folder api

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    if (!inputField || !chatBox) return;

    const message = inputField.value.trim();
    if (!message) return;

    // Tampilkan pesan user
    chatBox.innerHTML += `<div class="user-msg"><strong>You:</strong> ${message}</div>`;
    inputField.value = '';

    try {
        const response = await fetch(MIZU_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        
        // Ambil teks jawaban dari struktur data Gemini
        let mizuReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu is silent...";

        chatBox.innerHTML += `<div class="mizu-msg"><strong>Mizu:</strong> ${mizuReply}</div>`;
    } catch (error) {
        console.error("Fetch Error:", error);
        chatBox.innerHTML += `<div class="error">Mizu disconnected.</div>`;
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}
