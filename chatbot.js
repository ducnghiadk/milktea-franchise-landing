// ─── CONFIG ───────────────────────────────────────────────
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
const GEMINI_MODEL  = 'gemini-2.0-flash';
const SYSTEM_PROMPT = `Bạn là trợ lý ảo của Nghĩa - chuyên gia nhượng quyền mô hình trà sữa thực chiến tại Việt Nam với hơn 20 điểm bán thành công.

Vai trò:
- Tư vấn về mô hình nhượng quyền trà sữa: vốn 150-300 triệu, hồi vốn 6-10 tháng
- Giải thích quy trình 5 bước: Tư vấn → Khảo sát → Ký kết & Đào tạo → Thi công → Khai trương
- Nêu bật lợi ích: độc quyền khu vực 2km, hỗ trợ 24/7, thiết kế miễn phí, giảm 20% chi phí nguyên liệu
- Khuyến khích khách để lại thông tin hoặc inbox trực tiếp

Phong cách: thân thiện, chuyên nghiệp, ngắn gọn, dùng tiếng Việt tự nhiên, có thể dùng emoji nhẹ nhàng.
Thông tin liên hệ: Hotline 09xx xxx xxx | Văn phòng Quận 1, TP.HCM`;

// ─── STATE ───────────────────────────────────────────────
let chatHistory = [];
let isTyping    = false;
let chatOpen    = false;

// ─── TOGGLE ──────────────────────────────────────────────
function toggleChat() {
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
}

// ─── WELCOME ─────────────────────────────────────────────
function showWelcome() {
  appendBotMessage(`Xin chào! 👋 Tôi là **Trợ lý Nghĩa AI** — sẵn sàng tư vấn nhượng quyền trà sữa thực chiến.\n\nBạn muốn hỏi về:\n- 💰 Vốn đầu tư & thời gian hồi vốn\n- 📍 Khu vực kinh doanh phù hợp\n- 🔄 Quy trình nhượng quyền 5 bước\n- 🎁 Quyền lợi khi tham gia\n\nBắt đầu với câu hỏi nào nhé?`);
}

// ─── REFRESH ─────────────────────────────────────────────
function refreshChat() {
  const icon = document.getElementById('refresh-icon');
  icon.classList.add('spinning');
  setTimeout(() => icon.classList.remove('spinning'), 500);
  chatHistory = [];
  document.getElementById('chat-messages').innerHTML = '';
  setTimeout(showWelcome, 100);
}

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

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

// ─── SEND ────────────────────────────────────────────────
async function sendMessage() {
  const input   = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const text    = input.value.trim();
  if (!text || isTyping) return;
  input.value = ''; input.style.height = 'auto';
  appendUserMessage(text);
  chatHistory.push({ role: 'user', parts: [{ text }] });
  isTyping = true; sendBtn.disabled = true;
  showTyping();
  try {
    const reply = await callGemini();
    hideTyping();
    appendBotMessage(reply);
    chatHistory.push({ role: 'model', parts: [{ text: reply }] });
  } catch(err) {
    hideTyping();
    appendBotMessage('Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng liên hệ trực tiếp hotline **09xx xxx xxx** nhé!');
    console.error(err);
  } finally {
    isTyping = false; sendBtn.disabled = false; input.focus();
  }
}

// ─── GEMINI API ──────────────────────────────────────────
async function callGemini() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    await new Promise(r => setTimeout(r, 900 + Math.random()*600));
    return getDemoResponse(chatHistory[chatHistory.length-1].parts[0].text);
  }
  const url  = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: chatHistory,
    generationConfig: { temperature: 0.75, maxOutputTokens: 1024, topP: 0.9 }
  };
  const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || 'API error'); }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tôi chưa hiểu câu hỏi. Bạn thử hỏi lại nhé!';
}

// ─── DEMO MODE ───────────────────────────────────────────
function getDemoResponse(t) {
  const q = t.toLowerCase();
  if (q.match(/vốn|tiền|bao nhiêu|chi phí/)) {
    return `**Vốn đầu tư theo gói:**\n\n- 💰 **Gói nhỏ (20-30m²):** ~150 triệu\n- 💰 **Gói chuẩn (30-50m²):** 200–250 triệu\n- 💰 **Gói đầy đủ (50m²+):** ~300 triệu\n\nThời gian **hồi vốn trung bình 6–10 tháng** dựa trên 20 điểm bán hiện tại.\n\n👉 Để biết gói phù hợp với ngân sách của bạn, hãy để lại **số điện thoại** để Nghĩa tư vấn trực tiếp!`;
  }
  if (q.match(/quy trình|bước|thủ tục|quá trình/)) {
    return `**Quy trình nhượng quyền 5 bước:**\n\n1. 🤝 **Tư vấn ban đầu** — Trao đổi vốn, mặt bằng, kỳ vọng\n2. 📍 **Khảo sát mặt bằng** — Đội kỹ thuật thẩm định vị trí\n3. ✍️ **Ký kết & Đào tạo** — Chuyển giao công thức & quy trình\n4. 🏗️ **Thi công & Setup** — Hoàn thiện không gian theo chuẩn\n5. 🎉 **Khai trương & Vận hành** — Hỗ trợ onsite 3–5 ngày đầu\n\nTừ ký kết đến khai trương thường **4–6 tuần**.`;
  }
  if (q.match(/lợi ích|quyền lợi|nhận được|được gì/)) {
    return `**Quyền lợi khi tham gia:**\n\n- 🏆 **Độc quyền 2km** — cam kết không mở thêm điểm trong bán kính\n- 📱 **App quản lý** — kho, nhân sự, dòng tiền trong 1 app\n- 📣 **Marketing tổng lực** — hỗ trợ khai trương & duy trì khách\n- 🔑 **Công thức độc quyền** tối ưu theo mùa\n- 💲 **Giảm 20% chi phí** nguyên liệu qua nguồn giá gốc\n- 🛠️ **Hỗ trợ 24/7** từ đội ngũ Nghĩa\n- 🎨 **Thiết kế miễn phí** theo chuẩn thương hiệu`;
  }
  if (q.match(/kinh nghiệm|mới|chưa biết|người mới/)) {
    return `Hoàn toàn không cần kinh nghiệm! 🎯\n\nMô hình **\"Chìa khóa trao tay\"** của Nghĩa được thiết kế để người **mới bắt đầu** cũng vận hành trơn tru ngay từ ngày đầu.\n\nBạn sẽ được đào tạo bài bản về:\n- Pha chế & kiểm soát chat lượng\n- Quản lý nhân sự & kho hàng\n- Chiến lược marketing địa phương\n\n📞 Gọi **09xx xxx xxx** để đặt lịch tham quan 1 điểm bán thực tế nhé!`;
  }
  if (q.match(/hồi vốn|thu hồi|lãi|lợi nhuận/)) {
    return `**Thời gian hồi vốn thực tế:**\n\nDựa trên **20 điểm bán** hiện tại:\n- ⚡ **Nhanh nhất:** 5–6 tháng (vị trí đắc địa, vận hành tốt)\n- 📊 **Trung bình:** 6–10 tháng\n- 🐢 **Chậm hơn:** 10–12 tháng (vị trí ít traffic)\n\n> *Nghĩa cam kết tư vấn chọn vị trí để tối ưu thời gian hồi vốn cho bạn.*\n\n💬 Inbox ngay để được phân tích tiềm năng **khu vực của bạn**!`;
  }
  return `Cảm ơn bạn đã quan tâm! 🍵\n\nĐể được tư vấn chi tiết & cá nhân hóa nhất:\n\n- 📞 Hotline: **09xx xxx xxx**\n- 💬 Điền form ở cuối trang để Nghĩa gọi lại\n- 📍 Văn phòng: **Quận 1, TP.HCM**\n\nNghĩa sẽ phản hồi trong thời gian sớm nhất! 🚀`;
}