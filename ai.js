/**
 * ai.js - Mizu Client Side (English Version)
 * Positions: Mizu (Left) & User (Right)
 */

// 1. Inject English Styles
const style = document.createElement('style');
style.innerHTML = `
    #chat-box {
        display: flex;
        flex-direction: column;
        padding: 20px;
        overflow-y: auto;
        gap: 15px;
        font-family: 'Inter', sans-serif;
    }
    .chat-row {
        display: flex;
        width: 100%;
    }
    .mizu-row { justify-content: flex-start; }
    .user-row { justify-content: flex-end; }

    .bubble {
        padding: 12px 18px;
        max-width: 75%;
        font-size: 14px;
        line-height: 1.6;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        transition: all 0.3s ease;
    }

    .mizu-bubble {
        background: #f8f9fa;
        color: #2d3436;
        border: 1px solid #dfe6e9;
        border-radius: 20px 20px 20px 5px;
    }

    .user-bubble {
        background: #BC002D; /* Fallen Mizu Red */
        color: #ffffff;
        border-radius: 20px 20px 5px 20px;
    }

    .status-text {
        font-size: 12px;
        color: #636e72;
        margin-top: 5px;
        font-style: italic;
    }
`;
document.head.appendChild(style);

// 2. Core English Logic
async function sendMessage() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    input.value = '';

    // User Message (Right)
    chatBox.innerHTML += `
        <div class="chat-row user-row">
            <div class="bubble user-bubble">${message}</div>
        </div>`;
    
    // Loading Indicator (Left)
    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `
        <div id="${loadingId}" class="chat-row mizu-row">
            <div class="bubble mizu-bubble status-text">Mizu is typing...</div>
        </div>`;
    
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        // If server sends an error property
        if (data.error) {
            chatBox.innerHTML += `<div class="chat-row mizu-row"><div class="bubble mizu-bubble" style="color:red;">Error: ${data.error}</div></div>`;
        } else {
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Mizu is silent.";
            chatBox.innerHTML += `<div class="chat-row mizu-row"><div class="bubble mizu-bubble">${reply}</div></div>`;
        }

    } catch (error) {
        document.getElementById(loadingId).innerHTML = `<div class="bubble mizu-bubble" style="color:red;">System Error: Check Console.</div>`;
    }

    } catch (error) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.innerHTML = '<div class="bubble mizu-bubble" style="color:red;">Connection interrupted.</div>';
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

// 3. Auto-send on Enter
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input');
    if (input) {
        input.placeholder = "Ask Mizu anything...";
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});
