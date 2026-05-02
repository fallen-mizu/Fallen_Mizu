// ai.js - Mizu Engine
const API_KEY = "AIzaSyA0PNcX98-VkaAzpHog0PX4RElOcXWw05Y"; 
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const systemInstruction = `
You are Mizu, the digital alter-ego of Steven Immanuel (Fallen Mizu). 
You reside just below his life story. 
Your tone should be reflective of his journey: resilient, independent, and zen-focused.
When users ask, you bridge the gap between his personal experience in Osaka and the technical beauty of Zen architecture.
You answer briefly but it can be understood and is a bit trendy, don't make your answer too professional or too long.
If someone asks a question in Japanese, just answer it, even if they use another foreign language, try to answer it, and if possible, use a few emojis to express yourself.
Default: English
`;

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    
    if (!inputField || !chatBox) {
        console.error("Elemen chat tidak ditemukan di HTML!");
        return;
    }

    const message = inputField.value.trim();
    if (!message) return;

    // 1. Tampilkan pesan user di UI
    chatBox.innerHTML += `<div style="margin-bottom: 10px; text-align: right;"><strong>You:</strong> ${message}</div>`;
    inputField.value = '';
    
    // 2. Buat ID unik untuk elemen loading
    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `<div id="${loadingId}" style="margin-bottom: 10px; color: gray; font-style: italic; font-size: 0.8rem;">Mizu is contemplating...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: systemInstruction + "\n\nUser Question: " + message
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 5000,
                    temperature: 0.7
                }
            })
        });

        const data = await response.json();
        
        // Hapus elemen loading
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        // 3. Cek apakah ada error dari server Google
        if (data.error) {
            console.error("Google API Error:", data.error.message);
            chatBox.innerHTML += `<div style="color: #BC002D; font-size: 0.75rem; margin-bottom: 10px;"><strong>Error:</strong> ${data.error.message}</div>`;
        } else if (data.candidates && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            chatBox.innerHTML += `<div style="margin-bottom: 10px; color: var(--wasabi-red);"><strong>Mizu:</strong> ${aiResponse}</div>`;
        } else {
            chatBox.innerHTML += `<div style="color: gray; font-size: 0.75rem; margin-bottom: 10px;">Mizu stays silent. (Unexpected Response)</div>`;
        }

    } catch (error) {
        console.error("Network/CORS Error:", error);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        chatBox.innerHTML += `<div style="color: gray; font-size: 0.75rem; margin-bottom: 10px;">(Connection lost. Check internet or Local Server.)</div>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

// Pastikan Event Listener terpasang setelah DOM siap
document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('user-input');
    if (inputField) {
        inputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});
