# OPENCODE WEBUI — BÁO CÁO DỰ ÁN
**Ngày hoàn thành:** 10/09/2026
**Repo:** https://github.com/nhatnamdev662/opencode-webui
**Đường dẫn máy:** `E:\crack\opencode-webui`
**Commit cuối:** `ded387d`

---

## 1. TỔNG QUAN DỰ ÁN

**Mục tiêu:** Xây dựng Web UI thay thế `opencode web` mặc định, chạy bằng lệnh `opencode webui` mà KHÔNG làm ảnh hưởng đến OpenCode gốc. UI phục thuộc 100% vào dữ liệu/API của OpenCode Core.

**Kiến trúc:**
```
[Browser] → http://localhost:3456
      ↓
[cli.js Server] — Node.js HTTP Server thuần (không dependency ngoài)
      ├── Serve static files từ web/opencode-original/ (UI gốc của OpenCode đã tải về)
      ├── Reverse Proxy mọi API request → OpenCode Core (port tự dò: 52987/4096/...)
      └── Tự spawn `opencode serve` nếu chưa có server nào chạy
```

---

## 2. CÁC THÀNH PHẦN CHÍNH

### 2.1. CLI Wrapper (`bin/cli.js`)
- Lệnh `opencode webui` hoặc `opencode ui`: khởi động server UI + tự mở browser.
- Mọi lệnh khác (`opencode`, `opencode serve`, `opencode web`...): chuyển tiếp 100% về `opencode.exe` gốc — không đụng chạm.
- Tự động dò port OpenCode Core đang chạy qua danh sách port phổ biến, kiểm tra endpoint `/path` trả về JSON hợp lệ.
- Nếu không có server nào: tự spawn `opencode serve --port 4096` nền, đợi tối đa 15 giây.
- **Tối ưu hiệu năng (fix load chậm):**
  - In-memory RAM cache cho toàn bộ static files (độ trễ ~0ms).
  - Gzip pre-compression (bundle JS 2.7MB → ~770KB, nhanh gấp 4 lần).
  - HTTP 304 Not Modified + `Cache-Control: immutable` cho asset có hash.
  - `<link rel="modulepreload">` + preload CSS trong index.html.
  - SPA fallback: mọi route HTML (kể cả 200 từ core) đều trả index.html local đã inject — fix lỗi route session không load gaslight.

### 2.2. UI Gốc (web/opencode-original/)
- Tải trực tiếp bundle build của OpenCode web từ server core (JS + CSS + favicon + manifest).
- `index.html` được inject 1 hook nhỏ: `window.__OPENCODE_API_BASE__` (đọc từ query `?api=`).
- Giữ nguyên 100% tính năng gốc: chọn Project, Agent, Model, Chat, Diff, File tree, Permissions, Settings.

### 2.3. Tính năng Gaslight (web/opencode-original/gaslight.js - v3)
- **Chức năng:** Chỉnh sửa tin nhắn trả về của assistant (giống plugin `opencode-gaslight` trên TUI).
- **Vị trí nút Edit (v3):**
  - **Dưới đoạn chat của agent:** Đặt trong action bar footer `text-part-copy-wrapper` (cùng hàng với nút Copy response), không bao giờ đè lên nội dung chữ hay chèn vào giữa các đoạn văn bản.
  - **Dưới đoạn thinking (reasoning):** Đặt trong footer riêng `gaslight-reasoning-footer` ở dưới cùng của khối thinking với nhãn `Edit thinking`.
- **Cơ chế xác định phần tử chính xác 100%:**
  - Thay thế TreeWalker tìm text bằng selector chuẩn OpenCode: `[data-component="text-part"]` và `[data-component="reasoning-part"]` kết hợp `data-timeline-part-id`.
  - Tự động bật `showReasoningSummaries` trong localStorage `settings.v3` nếu đang bị tắt, giúp các khối thinking luôn được OpenCode hiển thị trên giao diện.
- **Popup editor:**
  - Chỉnh sửa nội dung, Save gọi `PATCH /session/{sessionID}/message/{messageID}/part/{partID}` với đầy đủ full part object + new text.
  - Đóng an toàn: Chỉ đóng khi bấm Cancel hoặc phím Esc, kéo thả bôi đen văn bản hay bấm ra ngoài không bị đóng nhầm.
- **Fix triệt để cache browser:**
  - Cập nhật `bin/cli.js` gửi header `Cache-Control: no-cache` riêng cho `/gaslight.js`.
  - Thêm query string `/gaslight.js?v=3` trong `index.html`. Browser luôn nạp ngay code mới nhất khi reload.

---

## 3. LỆNH SỬ DỤNG

```powershell
# Khởi động UI (ở thư mục project bất kỳ)
opencode webui
# hoặc
opencode ui

# Gỡ cài đặt sạch sẽ
npm unlink -g opencode-webui   # nếu đã npm link
```

**Lưu ý cấu hình máy hiện tại:**
- CLI hook đã cài tại `C:\Users\MAY1\AppData\Roaming\npm\opencode.cmd` và `opencode.ps1` — chặn keyword `webui`/`ui`, còn lại forward về exe gốc.
- Git push đã gắn username vào remote URL (`https://nhatnamdev662@github.com/...`) nên không cần chọn lại tài khoản.

---

## 4. API ENDPOINTS ĐÃ KHÁM PHÁ (tài liệu để làm tiếp)

Server OpenCode có OpenAPI spec đầy đủ tại `/doc` (162 paths). Các endpoint quan trọng đã dùng/đã verify:

| Endpoint | Method | Ghi chú |
|---|---|---|
| `/session` | GET/POST | Danh sách / tạo session |
| `/session/{sid}/message` | GET | Lấy tin nhắn (dùng cho gaslight cache) |
| `/session/{sid}/message/{mid}/part/{pid}` | **PATCH** | **Sửa part — body PHẢI có sessionID+messageID+id+type+text** |
| `/session/{sid}/message/{mid}/part/{pid}` | DELETE | Xóa part |
| `/session/{sid}/prompt_async` | POST | Gửi prompt (body: `{parts: [{type:'text', text}], model?, agent?}`) |
| `/session/{sid}/abort` | POST | Dừng sinh |
| `/permission` | GET | Danh sách permission đang chờ |
| `/permission/{rid}/reply` | POST | Body: `{reply: "once"\|"always"\|"reject"}` |
| `/project` | GET | Danh sách project |
| `/config/providers` | GET | Providers + models đã cấu hình |
| `/agent` | GET | Danh sách agent (build/plan/explore...) |
| `/file?path=` | GET | List file/thư mục |
| `/file/content?path=` | GET | Đọc nội dung file |
| `/global/event` | GET | SSE stream sự kiện toàn cục |
| `/session/{sid}/diff` | GET | Diff các file thay đổi |

**Phần body PATCH part (đã test 200 OK):**
```json
{
  "id": "prt_xxx",
  "sessionID": "ses_xxx",
  "messageID": "msg_xxx",
  "type": "text",
  "text": "nội dung mới",
  "time": { "start": 1789047888354, "end": 1789047888772 }
}
```
> Mẹo: lấy toàn bộ object part gốc từ `/session/{sid}/message` rồi override `text` — an toàn nhất.

---

## 5. TRẠNG THÁI HIỆN TẠI & VIỆC CÒN DỞ DỞ (LÀM TIẾP)

### ✅ Đã hoạt động:
- Server proxy + static serve + tối ưu tốc độ — ổn định.
- Nút Edit xuất hiện trên đúng các part text/reasoning.
- PATCH sửa part thành công (đã test thực tế — tin nhắn đổi thành `[GASLIGHT TEST]...` và reload hiển thị đúng).

### ⚠️ Việc còn treo (quan trọng — làm tiếp đầu tiên):
1. **gaslight.js bản v2 chưa được browser nạp đúng:** Server đã serve đúng file v2 (`hasV2: true`, đã bỏ logic close-on-overlay-click), NHƯNG trang đang mở vẫn chạy script cũ (do trước đó test bằng `eval` inline). **Chỉ cần mở tab mới / hard refresh là xong** — không phải sửa code gì thêm.
2. **Sau khi sửa xong 1 part thì reload trang** — chấp nhận được nhưng có thể cải tiến: cập nhật DOM trực tiếp không cần reload.
3. **Part reasoning:** chưa test thực tế với model có reasoning (muse spark không trả reasoning). Logic đã viết sẵn, chỉ cần test với model khác.

### 📋 Ý tưởng tính năng tiếp theo (đã thảo luận, chưa làm):
1. **1-Click Developer Actions:** nút Git Review / Smart Commit / Auto Test & Fix / Explain Code trên thanh prompt.
2. **Terminal Web nhúng:** dùng API `/api/pty` + xterm.js.
3. **Prompt Library / Slash Commands:** gõ `/` hiện menu template, lưu template riêng vào localStorage.
4. **Session nâng cao:** Pin session, tìm kiếm xuyên suốt, Export Markdown/PDF.
5. **System Monitor:** RAM/CPU, token/cost tiêu tốn, tốc độ sinh token.

---

## 6. LỖI ĐÃ GẶP & CÁCH XỬ LÝ (tránh lặp lại)

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| PATCH 400 "Missing key sessionID" | Body thiếu sessionID/messageID | Gửi full part object |
| Route session không có nút Edit | SPA fallback của core trả HTML gốc (không có gaslight.js) | cli.js chặn mọi response HTML (kể cả 200) trả index.html local |
| Sửa file nhưng browser vẫn chạy code cũ | Browser cache + server RAM cache theo mtime | Hard refresh; file mới có mtime mới nên RAM cache tự invalidate |
| WSL error khi chạy opencode serve | opencode.ps1 gọi qua pwsh/WSL | Gọi trực tiếp `opencode.exe` bằng đường dẫn đầy đủ |
| npm link không tạo lệnh `opencode webui` | npm chỉ tạo bin theo tên package | Ghi đè trực tiếp shim `opencode.cmd/.ps1` trong npm dir |

---

## 7. FILE QUAN TRỌNG

```
E:\crack\opencode-webui\
├── bin\cli.js                        # Server + CLI (proxy, cache, gzip, SPA fallback)
├── package.json
├── web\opencode-original\
│   ├── index.html                    # UI gốc + inject API hook + gaslight.js
│   ├── gaslight.js                   # Tính năng gaslight v2
│   ├── assets\index-BpB7SL4b.js      # Bundle gốc OpenCode (2.7MB)
│   ├── assets\index-DLiUNAg_.css     # CSS gốc
│   └── assets\dialog-settings-BNJrAnxn.js  # (bản gốc, chưa patch)
└── .gitignore
```

**Kiểm tra nhanh sau khi mở phiên mới:**
1. `opencode webui` → mở http://localhost:3456
2. Vào 1 session → hover tin nhắn assistant → thấy nút **Edit** góc phải
3. Bấm Edit → popup mở → thử click ngoài/drag chọn text → KHÔNG được tắt
4. Chỉnh text → Save → toast "Updated! Reloading..." → trang reload hiện nội dung mới
