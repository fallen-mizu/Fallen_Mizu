// ai.js
async function sendMessage() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    
    if (!input || !input.value.trim()) return;
    
    const userMsg = input.value.trim();
    
    // Tampilkan pesan User di sebelah KANAN
    chatBox.innerHTML += `
        <div class="chat-container user-container">
            <div class="msg-user">${userMsg}</div>
        </div>`;
    
    input.value = '';

    // Indikator loading di sebelah KIRI (Mizu)
    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `
        <div id="${loadingId}" class="chat-container mizu-container">
            <div class="msg-mizu">Mizu is thinking...</div>
        </div>`;
    
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMsg })
        });

        const data = await response.json();
        document.getElementById(loadingId).remove();

        const mizuReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu is silent.";

        // Tampilkan jawaban Mizu di sebelah KIRI
        chatBox.innerHTML += `
            <div class="chat-container mizu-container">
                <div class="msg-mizu">${mizuReply}</div>
            </div>`;
        
    } catch (error) {
        if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
        chatBox.innerHTML += `<div class="chat-container mizu-container"><div class="msg-mizu" style="color:red;">Connection lost.</div></div>`;
    }
    
    chatBox.scrollTop = chatBox.scrollHeight;
}
