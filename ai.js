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
.chat-container {
    display: flex;
    width: 100%;
    margin-bottom: 15px;
}

/* Posisi Mizu (Kiri) */
.mizu-container {
    justify-content: flex-start;
}

/* Posisi User (Kanan) */
.user-container {
    justify-content: flex-end;
}

/* Balon Chat Mizu */
.msg-mizu {
    background-color: #f0f0f0; /* Abu-abu muda klasik */
    color: #333;
    padding: 10px 15px;
    border-radius: 15px 15px 15px 0px; /* Sudut kiri bawah lancip */
    max-width: 70%;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
}

/* Balon Chat User */
.msg-user {
    background-color: #BC002D; /* Merah khas bendera Jepang */
    color: white;
    padding: 10px 15px;
    border-radius: 15px 15px 0px 15px; /* Sudut kanan bawah lancip */
    max-width: 70%;
    box-shadow: -2px 2px 5px rgba(0,0,0,0.1);
}

/* Scroll otomatis lancar */
#chat-box {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 10px;
        }
