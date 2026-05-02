// ai.js - The Soul of Mizu
const API_KEY = "AIzaSyDNAmiNFqUAfFokwQWBSNpQRzXDByBVh1E"; // Masukkan API Key Gemini Anda di sini
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

    // Display user message
    chatBox.innerHTML += `<div style="margin-bottom: 10px; text-align: right;"><strong>You:</strong> ${message}</div>`;
    inputField.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemInstruction + "\n\nUser Question: " + message }] }
                ]
            })
        });

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        // Display AI message
        chatBox.innerHTML += `<div style="margin-bottom: 10px; color: var(--wasabi-red);"><strong>Mizu:</strong> ${aiResponse}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.error("Error connecting to Mizu:", error);
        chatBox.innerHTML += `<div style="color: gray; font-size: 0.7rem;">(Mizu is currently meditating. Please try again later.)</div>`;
    }
}

// Allow "Enter" key to send message
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
  
