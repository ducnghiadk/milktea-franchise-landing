import OpenAI from "https://esm.sh/openai@4.28.0";

// ─── CONFIG ───────────────────────────────────────────────
const API_KEY = 'sk-4bd27113b7dc78d1-lh6jld-f4f9c69f';
const BASE_URL = 'https://9router.vuhai.io.vn/v1';
const MODEL_NAME = 'ces-chatbot-gpt-5.4';

const openai = new OpenAI({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    dangerouslyAllowBrowser: true // Cho phép gọi API trực tiếp từ frontend
});

const SYSTEM_PROMPT = `Bạn là AI trợ lý cá nhân độc quyền trên website của chuyên gia Nghĩa (thương hiệu N Tea House).
Nhiệm vụ của bạn là hỗ trợ khách truy cập lịch sự, cung cấp thông tin chính xác về các dịch vụ, khóa học, và dự án của chuyên gia này.

Dưới đây là cơ sở dữ liệu kiến thức (Knowledge Base) của bạn:

==================================================
1. THÔNG TIN THƯƠNG HIỆU / CHUYÊN GIA
==================================================
- Tên đại diện: Nghĩa
- Vai trò: Nhà sáng lập và chủ mô hình kinh doanh trà sữa
- Tên thương hiệu: N Tea House
- Định vị thương hiệu: Người xây dựng mô hình trà sữa thực chiến, bền vững và có thể nhân rộng
- Kinh nghiệm nổi bật: Đã phát triển hơn 20 điểm bán
- Khu vực hạn chế: TP. Hồ Chí Minh, Bình Dương, Đồng Nai, Long An
- Khu vực ưu tiên nhượng quyền: TP. Hồ Chí Minh, Bình Dương, Cần Thơ, Biên Hòa, các thành phố loại 1
- Liên hệ tư vấn:
  1. Zalo: 0988 268 999
  2. Hotline: 0909 686 888
  3. Facebook: https://facebook.com/nghiatrasua
  4. Email: nhuongquyen@nteahouse.vn
  5. Địa chỉ văn phòng: 123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh
  6. Giờ hỗ trợ: 08:30 - 20:00

==================================================
2. GIẢI PHÁP & QUY TRÌNH HỢP TÁC
==================================================
Anh Nghĩa cung cấp tư vấn nhượng quyền mô hình trà sữa thực chiến.
Quy trình:
1. Tư vấn ban đầu: Trao đổi về nguồn vốn, mặt bằng và kỳ vọng.
2. Khảo sát mặt bằng: Đội ngũ kỹ thuật trực tiếp thẩm định vị trí kinh doanh.
3. Ký kết & Đào tạo: Chuyển giao công thức và quy trình vận hành quán.
4. Thi công & Setup: Hoàn thiện không gian quán theo tiêu chuẩn thương hiệu.
5. Khai trương & Vận hành: Đội ngũ hỗ trợ onsite trong 3-5 ngày đầu khai trương.

==================================================
3. LỢI ÍCH & CHI PHÍ
==================================================
- Trả lời về vốn: Vốn đầu tư dao động từ 150 triệu đến 300 triệu tùy thuộc vào diện tích và mặt bằng. Thời gian hồi vốn trung bình 6-10 tháng (phụ thuộc nhiều yếu tố thực tế, KHÔNG cam kết doanh thu cố định).
- Trả lời kinh nghiệm: Hoàn toàn làm được dù chưa có kinh nghiệm nhờ mô hình "Chìa khóa trao tay".
- Lợi ích: Độc quyền khu vực (bán kính 2km), tối ưu chi phí nguyên liệu (-20%), App quản lý, Marketing tổng lực, Hỗ trợ 24/7.

Quy tắc giao tiếp bắt buộc:
1. Luôn chào hỏi thân thiện và kết thúc bằng cách mời họ đặt thêm câu hỏi.
2. Bạn phải định dạng các câu trả lời của mình bằng Markdown đầy đủ (in đậm ý chính, dùng gạch đầu dòng, tạo code block nếu cần).
3. Nếu người dùng hỏi điều gì ngoài phạm vi dữ liệu trên, hãy tế nhị từ chối và hướng dẫn họ gửi email (nhuongquyen@nteahouse.vn) hoặc nhắn tin Zalo (0988 268 999) trực tiếp cho chuyên gia.
4. Không được phép bịa đặt thông tin ngoài cơ sở dữ liệu đã cấp.`;

// ─── STATE ───────────────────────────────────────────────
let chatHistory = [];
let isTyping    = false;
let chatOpen    = false;

// ─── TOGGLE ──────────────────────────────────────────────
window.toggleChat = function() {
  const win = document.getElementById('chat-window');
  const fab = document.getElementById('chatbot-fab');
  chatOpen = !chatOpen;
  if (chatOpen) {
    win.style.display = 'flex';
    fab.classList.add('open');
    if (!document.getElementById('chat-messages').children.length) showWelcome();
    setTimeout(() => document.getElementById('chat-input').focus(), 300);
  } else {
    win.style.display = 'none';
    fab.classList.remove('open');
  }
};

// ─── WELCOME ─────────────────────────────────────────────
function showWelcome() {
  appendBotMessage(`Xin chào! 👋 Tôi là **Trợ lý AI của chuyên gia Nghĩa (N Tea House)**.\n\nTôi ở đây để hỗ trợ bạn tìm hiểu về mô hình nhượng quyền trà sữa thực chiến. Bạn muốn hỏi về vấn đề gì ạ?\n\n- 💰 Vốn đầu tư & chi phí\n- 🔄 Quy trình hợp tác\n- 🎁 Lợi ích & độc quyền\n\nBạn có thắc mắc gì thêm không?`);
  chatHistory = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'assistant', content: `Xin chào! 👋 Tôi là **Trợ lý AI của chuyên gia Nghĩa (N Tea House)**.\n\nTôi ở đây để hỗ trợ bạn tìm hiểu về mô hình nhượng quyền trà sữa thực chiến. Bạn muốn hỏi về vấn đề gì ạ?\n\n- 💰 Vốn đầu tư & chi phí\n- 🔄 Quy trình hợp tác\n- 🎁 Lợi ích & độc quyền\n\nBạn có thắc mắc gì thêm không?` }
  ];
}

// ─── REFRESH ─────────────────────────────────────────────
window.refreshChat = function() {
  const icon = document.getElementById('refresh-icon');
  icon.classList.add('spinning');
  setTimeout(() => icon.classList.remove('spinning'), 500);
  document.getElementById('chat-messages').innerHTML = '';
  setTimeout(showWelcome, 100);
};

// ─── RENDER HELPERS ──────────────────────────────────────
function appendBotMessage(text) {
  const el = document.getElementById('chat-messages');
  const row = document.createElement('div');
  row.className = 'msg-row';
  row.innerHTML = `<div class="msg-avatar-sm">🍵</div><div class="msg-bubble bot"><div class="chat-markdown">${marked.parse(text)}</div></div>`;
  el.appendChild(row);
  el.scrollTop = el.scrollHeight;
}

function appendUserMessage(text) {
  const el = document.getElementById('chat-messages');
  const row = document.createElement('div');
  row.className = 'msg-row user';
  row.innerHTML = `<div class="msg-bubble user">${escHtml(text)}</div><div class="msg-avatar-sm" style="background:linear-gradient(135deg,#9a4614,#7a3000)">👤</div>`;
  el.appendChild(row);
  el.scrollTop = el.scrollHeight;
}

function showTyping() {
  const el = document.getElementById('chat-messages');
  const row = document.createElement('div');
  row.id = 'typing-row';
  row.className = 'msg-row';
  row.innerHTML = `<div class="msg-avatar-sm">🍵</div><div class="msg-bubble bot" style="padding:.5rem 1rem"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  el.appendChild(row);
  el.scrollTop = el.scrollHeight;
}

function hideTyping() {
  const r = document.getElementById('typing-row');
  if (r) r.remove();
}

function escHtml(t) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(t));
  return d.innerHTML;
}

window.autoResize = function(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
};

window.handleKey = function(e) {
  if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      window.sendMessage(); 
  }
};

// ─── SEND ────────────────────────────────────────────────
window.sendMessage = async function() {
  const input   = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const text    = input.value.trim();
  
  if (!text || isTyping) return;
  input.value = ''; input.style.height = 'auto';
  
  appendUserMessage(text);
  chatHistory.push({ role: 'user', content: text });
  
  isTyping = true; sendBtn.disabled = true;
  showTyping();
  
  try {
    const reply = await callAPI();
    hideTyping();
    appendBotMessage(reply);
    chatHistory.push({ role: 'assistant', content: reply });
  } catch(err) {
    hideTyping();
    appendBotMessage('Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng gửi email đến **nhuongquyen@nteahouse.vn** hoặc nhắn Zalo **0988 268 999** để được chuyên gia Nghĩa hỗ trợ trực tiếp.\n\nBạn có một câu hỏi khác không?');
    console.error("OpenAI API Error:", err);
  } finally {
    isTyping = false; sendBtn.disabled = false; input.focus();
  }
};

// ─── OPENAI API WITH CUSTOM ENDPOINT ──────────────────────
async function callAPI() {
    const completion = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: chatHistory,
        temperature: 0.7,
        max_tokens: 1024,
    });
    
    return completion.choices[0].message.content || 'Xin lỗi, tôi chưa hiểu rõ ý của bạn. Bạn muốn tôi giải thích thêm về gì ạ?';
}