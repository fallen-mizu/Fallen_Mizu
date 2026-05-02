/**
 * ai.js - Integrated English UI
 * Positions: Mizu (Left) | User (Right)
 */

// 1. Inject UI Styles
const style = document.createElement('style');
style.innerHTML = `
    #chat-box {
        display: flex;
        flex-direction: column;
        padding: 15px;
        gap: 15px;
        overflow-y: auto;
        height: 400px; /* Adjust as needed */
    }
    .chat-row { display: flex; width: 100%; }
    .mizu-row { justify-content: flex-start; }
    .user-row { justify-content: flex-end; }

    .bubble {
        padding: 10px 15px;
        max-width: 80%;
        font-size: 14px;
        line-height: 1.5;
        border-radius: 15px;
    }

    .mizu-bubble {
        background: #f1f1f1;
        color: #333;
        border-bottom-left-radius: 2px;
    }

    .user-bubble {
        background: #BC002D;
        color: #fff;
        border-bottom-right-radius: 2px;
    }

    .loading { font-style: italic; opacity: 0.7; font-size: 12px; }
`;
document.head.appendChild(style);

// 2. Chat Logic
async function sendMessage() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    
    if (!input || !input.value.trim()) return;
    
    const text = input.value.trim();
    input.value = '';

    // Show User Message (Right)
    chatBox.innerHTML += `
        <div class="chat-row user-row">
            <div class="bubble user-bubble">${text}</div>
        </div>`;
    
    // Show Loading (Left)
    const tempId = "load-" + Date.now();
    chatBox.innerHTML += `
        <div id="${tempId}" class="chat-row mizu-row">
            <div class="bubble mizu-bubble loading">Mizu is contemplating...</div>
        </div>`;
    
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // Use relative path for Vercel compatibility
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });

        const result = await response.json();
        const loader = document.getElementById(tempId);
        if (loader) loader.remove();

        if (result.error) {
            chatBox.innerHTML += `<div class="chat-row mizu-row"><div class="bubble mizu-bubble" style="color:red">Error: ${result.error}</div></div>`;
        } else {
            const mizuText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu remains silent.";
            chatBox.innerHTML += `
                <div class="chat-row mizu-row">
                    <div class="bubble mizu-bubble">${mizuText}</div>
                </div>`;
        }
    } catch (e) {
        const loader = document.getElementById(tempId);
        if (loader) loader.innerHTML = `<div class="bubble mizu-bubble" style="color:red">Connection failed.</div>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

// Enter Key Support
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input');
    if(input) {
        input.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
    }
});
