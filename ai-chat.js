/* ═══════════════════════════════════════════════════════════════
   ai-chat.js v2.3 — Zalo Style AI Chatbot (Trợ Lý Phúc)
   - Fix lỗi API Key định dạng mới (AQ...) bằng Header
   ═══════════════════════════════════════════════════════════════ */

const AIChat = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // 👇 KEY MỚI CỦA BẠN ĐÃ ĐƯỢC GẮN VÀO ĐÂY
    const GEMINI_KEY = 'AQ.Ab8RN6Loc78uV31rWHwf6t0_YMeQMsI5YjKFgZl3prVn7Py63Q';
    // ═══════════════════════════════════════════════════════════

    let state = {
        messages: [], 
        isTyping: false,
    };

    // Đã bỏ ?key= ở URL, chuyển sang dùng Header
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    // ═══ CSS INJECTION ═══
    function injectCSS() {
        if (document.getElementById('ai-chat-style')) return;
        const style = document.createElement('style');
        style.id = 'ai-chat-style';
        style.textContent = `
            .ai-fab { position: fixed; bottom: 100px; left: 20px; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #0068FF, #0050C7); color: #FFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0, 104, 255, 0.4); cursor: pointer; z-index: 1000; transition: transform 0.2s; font-size: 24px; font-weight: 800; }
            .ai-fab:active { transform: scale(0.9); }
            .zalo-chat-modal { position: fixed; inset: 0; z-index: 10000; display: none; background: #E5F1FB; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; animation: slideUpChat 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
            .zalo-chat-modal.open { display: flex; }
            @keyframes slideUpChat { from { transform: translateY(100%); } to { transform: translateY(0); } }
            
            .zalo-header { background: #FFFFFF; padding: 12px 16px; display: flex; align-items: center; box-shadow: 0 1px 4px rgba(0,0,0,0.05); z-index: 10; height: 64px; box-sizing: border-box; }
            .zalo-back { font-size: 24px; color: #0050C7; margin-right: 12px; cursor: pointer; }
            .zalo-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #FF9A9E, #FECFEF); display: flex; align-items: center; justify-content: center; color: #FFF; font-weight: 800; font-size: 20px; margin-right: 12px; }
            .zalo-info { flex: 1; }
            .zalo-name { font-size: 16px; font-weight: 700; color: #1E293B; }
            .zalo-status { font-size: 12px; color: #64748B; margin-top: 2px; }
            
            .zalo-messages { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background-image: url('data:image/svg+xml;utf8,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="1.5" fill="%23D0E2F3" /></svg>'); }
            .zalo-msg-row { display: flex; align-items: flex-end; gap: 8px; max-width: 85%; }
            .zalo-msg-row.bot { align-self: flex-start; }
            .zalo-msg-row.user { align-self: flex-end; flex-direction: row-reverse; }
            .zalo-bubble { padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.5; word-wrap: break-word; position: relative; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            .zalo-msg-row.bot .zalo-bubble { background: #FFFFFF; color: #1E293B; border-bottom-left-radius: 4px; }
            .zalo-msg-row.user .zalo-bubble { background: #0068FF; color: #FFFFFF; border-bottom-right-radius: 4px; }
            
            .zalo-bubble p { margin: 0 0 8px 0; }
            .zalo-bubble p:last-child { margin: 0; }
            .zalo-bubble strong { font-weight: 700; }
            .zalo-bubble ul { margin: 4px 0 8px 20px; padding: 0; }
            .zalo-bubble li { margin-bottom: 4px; }
            .typing-dots { display: inline-flex; gap: 4px; align-items: center; height: 16px; }
            .typing-dots span { width: 6px; height: 6px; background: #94A3B8; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
            .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
            .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
            @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
            
            .zalo-input-area { background: #FFFFFF; padding: 12px 16px; display: flex; align-items: center; gap: 12px; padding-bottom: calc(12px + env(safe-area-inset-bottom)); border-top: 1px solid #E2E8F0; }
            .zalo-input { flex: 1; background: #F1F5F9; border: none; border-radius: 20px; padding: 12px 16px; font-size: 14px; color: #1E293B; outline: none; resize: none; max-height: 100px; font-family: inherit; }
            .zalo-send-btn { width: 40px; height: 40px; border-radius: 50%; background: #0068FF; color: #FFF; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
            .zalo-send-btn:active { transform: scale(0.9); }
            .zalo-send-btn:disabled { background: #CBD5E1; }
        `;
        document.head.appendChild(style);
    }

    // ═══ UI HTML ═══
    function createUI() {
        if (document.getElementById('zalo-chat-modal')) return;

        const html = `
            <div class="ai-fab" id="ai-fab" onclick="AIChat.toggle()">P</div>

            <div class="zalo-chat-modal" id="zalo-chat-modal">
                <div class="zalo-header">
                    <div class="zalo-back" onclick="AIChat.toggle()">‹</div>
                    <div class="zalo-avatar">P</div>
                    <div class="zalo-info">
                        <div class="zalo-name">Phúc (Trợ lý)</div>
                        <div class="zalo-status">Đang hoạt động</div>
                    </div>
                </div>

                <div class="zalo-messages" id="zalo-messages"></div>

                <div class="zalo-input-area">
                    <input type="text" class="zalo-input" id="zalo-input" placeholder="Nhắn tin cho Phúc..." onkeypress="AIChat.handleEnter(event)">
                    <button class="zalo-send-btn" id="zalo-send-btn" onclick="AIChat.sendMessage()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        
        const savedMsgs = localStorage.getItem('tt_ai_messages');
        if (savedMsgs) {
            state.messages = JSON.parse(savedMsgs);
            renderMessages();
        } else {
            state.messages.push({ role: 'model', text: 'Chào bạn, mình là Phúc đây! 🌟 Mình có thể giúp bạn tính lương, tư vấn luật lao động, hoặc giải đáp thắc mắc dựa trên dữ liệu chấm công. Bạn cần giúp gì không?' });
            renderMessages();
        }
    }

    // ═══ RENDER MESSAGES ═══
    function renderMessages() {
        const box = document.getElementById('zalo-messages');
        if (!box) return;

        let html = '';
        state.messages.forEach(msg => {
            const isUser = msg.role === 'user';
            const bubbleCls = isUser ? 'user' : 'bot';
            
            let parsedText = msg.text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^- (.*?)$/gm, '<li>$1</li>')
                .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
                .replace(/\n/g, '<br>');

            html += `
                <div class="zalo-msg-row ${bubbleCls}">
                    <div class="zalo-bubble">${parsedText}</div>
                </div>
            `;
        });

        if (state.isTyping) {
            html += `
                <div class="zalo-msg-row bot" id="typing-indicator">
                    <div class="zalo-bubble">
                        <div class="typing-dots"><span></span><span></span><span></span></div>
                    </div>
                </div>
            `;
        }

        box.innerHTML = html;
        box.scrollTop = box.scrollHeight;
    }

    // ═══ API CALL (GEMINI) ═══
    async function callGeminiAPI(userText) {
        const settings = window.settings || {};
        const workLogs = window.workLogs || [];
        const currentMonth = new Date().getMonth() + 1;
        
        const monthLogs = workLogs.filter(l => new Date(l.date).getMonth() + 1 === currentMonth);
        const totalSalary = monthLogs.reduce((sum, l) => sum + (l.totalPay || 0), 0);

        const systemPrompt = `Bạn tên là Phúc, một trợ lý ảo thân thiện và thông minh trên ứng dụng TimeTracker. 
Nhiệm vụ của bạn là tư vấn về luật lao động Việt Nam, cách tính lương, và hỗ trợ người dùng.
Xưng hô: Gọi người dùng là "bạn" và xưng là "mình" hoặc "Phúc".
Dưới đây là thông tin hiện tại của người dùng:
- Tên: ${settings.profileName || 'Người dùng'}
- Lương cơ bản: ${settings.baseSalary || 0} VNĐ
- Ngày công chuẩn: ${settings.standardWorkDays || 26}
- Tổng lương dự kiến tháng này: ${totalSalary} VNĐ
- Số ngày đã làm tháng này: ${monthLogs.length} ngày.

Hãy trả lời ngắn gọn, thân thiện. Sử dụng Markdown (in đậm, gạch đầu dòng) để dễ đọc.`;

        const payload = {
            contents: [
                { role: "user", parts: [{ text: systemPrompt + "\n\nCâu hỏi của người dùng: " + userText }] }
            ]
        };

        try {
            // Gửi Key qua Header thay vì URL để tương thích với key AQ...
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_KEY
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('[AI Chat] Error:', error);
            return "⚠️ **Lỗi kết nối:** " + error.message + ". Bạn kiểm tra lại mạng nhé!";
        }
    }

    // ═══ ACTIONS ═══
    async function sendMessage() {
        const input = document.getElementById('zalo-input');
        const btn = document.getElementById('zalo-send-btn');
        const text = input.value.trim();
        if (!text || state.isTyping) return;

        input.value = '';
        state.messages.push({ role: 'user', text });
        renderMessages();

        state.isTyping = true;
        btn.disabled = true;
        renderMessages();

        const aiReply = await callGeminiAPI(text);

        state.isTyping = false;
        btn.disabled = false;
        state.messages.push({ role: 'model', text: aiReply });
        
        if (state.messages.length > 50) state.messages = state.messages.slice(-50);
        localStorage.setItem('tt_ai_messages', JSON.stringify(state.messages));
        
        renderMessages();
    }

    function handleEnter(e) {
        if (e.key === 'Enter') sendMessage();
    }

    function toggle() {
        const modal = document.getElementById('zalo-chat-modal');
        if (modal.classList.contains('open')) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        } else {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                const box = document.getElementById('zalo-messages');
                if (box) box.scrollTop = box.scrollHeight;
            }, 100);
        }
    }

    function init() {
        injectCSS();
        createUI();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    return { toggle, sendMessage, handleEnter, init };
})();