// ai.js
const API_KEY = "MASUKKAN_API_KEY_DISINI"; 
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const systemInstruction = `
You are Mizu, the digital alter-ego of Steven Immanuel (Fallen Mizu). 
You reside just below his life story. 
Your tone should be reflective of his journey: resilient, independent, and zen-focused.
When users ask, you bridge the gap between his personal experience in Osaka and the technical beauty of Zen architecture.
Default: English.
`;

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const message = inputField.value.trim();

    if (!message) return;

    // 1. Tampilkan pesan user
    chatBox.innerHTML += `<div style="margin-bottom: 10px; text-align: right;"><strong>You:</strong> ${message}</div>`;
    
    // 2. Bersihkan input & tampilkan status loading
    inputField.value = '';
    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `<div id="${loadingId}" style="margin-bottom: 10px; color: gray; font-style: italic;">Mizu is thinking...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: systemInstruction + "\n\nUser: " + message }]
                }]
            })
        });

        const data = await response.json();
        
        // Hapus status loading
        document.getElementById(loadingId).remove();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            chatBox.innerHTML += `<div style="margin-bottom: 10px; color: var(--wasabi-red);"><strong>Mizu:</strong> ${aiResponse}</div>`;
        } else {
            throw new Error("Invalid Response");
        }

    } catch (error) {
        console.error("Mizu Error:", error);
        if (document.getElementById(loadingId)) document.getElementById(loadingId).remove();
        chatBox.innerHTML += `<div style="color: gray; font-size: 0.7rem;">(Connection lost. Check API Key or Internet.)</div>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

// Tambahkan listener untuk tombol Enter
document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('user-input');
    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});
