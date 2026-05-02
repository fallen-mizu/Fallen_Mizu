// ai.js
async function sendMessage() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    
    if (!input || !input.value.trim()) return;
    
    const userMsg = input.value.trim();
    chatBox.innerHTML += `<div class="msg-user"><strong>You:</strong> ${userMsg}</div>`;
    input.value = '';

    // Indikator loading
    const loadingMsg = document.createElement('div');
    loadingMsg.innerText = "Mizu is thinking...";
    chatBox.appendChild(loadingMsg);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMsg })
        });

        const data = await response.json();
        loadingMsg.remove();

        const mizuReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu is silent.";
        chatBox.innerHTML += `<div class="msg-mizu"><strong>Mizu:</strong> ${mizuReply}</div>`;
        
    } catch (error) {
        loadingMsg.innerText = "Connection lost.";
    }
    
    chatBox.scrollTop = chatBox.scrollHeight;
      }
        
