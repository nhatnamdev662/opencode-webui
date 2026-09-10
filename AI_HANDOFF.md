# COPY-PASTE CHO AI MỚI (Phiên tiếp theo)

> Copy toàn bộ khối dưới đây gửi cho AI mới để nó hiểu project ngay, không cần giải thích lại.

---

Chào AI, tiếp tục project `opencode-webui` của tôi.

**1. Mục tiêu project:**
Custom Web UI cho OpenCode, chạy bằng lệnh `opencode webui` (mở http://localhost:3456), KHÔNG sửa OpenCode gốc. UI phụ thuộc 100% API của OpenCode Core. Repo local: `E:\crack\opencode-webui`, GitHub: https://github.com/nhatnamdev662/opencode-webui (branch master, commit mới nhất `fe50352`).

**2. Kiến trúc hiện tại:**
- `bin/cli.js` = Node HTTP server thuần (không dep ngoài): serve static từ `web/opencode-original/` + reverse proxy mọi API về OpenCode Core (tự dò port qua `/path`: 52987/4096/...), tự spawn `opencode serve` nếu chưa chạy. Có RAM cache + gzip + 304 + SPA fallback (mọi route HTML trả về index.html local).
- `web/opencode-original/` = bundle gốc OpenCode tải về (index.html + assets/index-BpB7SL4b.js 2.7MB + CSS + dialog-settings...). index.html đã inject `window.__OPENCODE_API_BASE__` + `<script src="/gaslight.js">` + preload.
- `web/opencode-original/gaslight.js` (v2) = tính năng chỉnh sửa tin nhắn assistant (giống plugin opencode-gaslight TUI): intercept `window.fetch` cache message list → MutationObserver tìm DOM chứa text → gắn nút Edit (chỉ trên part `type:text` hoặc `type:reasoning` của assistant, KHÔNG gắn tool/step/user). Popup editor Save gọi `PATCH /session/{sid}/message/{mid}/part/{pid}`.
- Hook lệnh `opencode webui` đã cài ở `C:\Users\MAY1\AppData\Roaming\npm\opencode.cmd` và `opencode.ps1`.

**3. API quan trọng (OpenAPI ở `GET /doc`, 162 paths, đã verify):**
- `GET /session/{sid}/message` → lấy messages + parts (mỗi part có `id, type, text, sessionID, messageID`).
- `PATCH /session/{sid}/message/{mid}/part/{pid}` → **body BẮT BUỘC phải là full part object + text mới, gồm `sessionID, messageID, id, type, text`** (thiếu là 400 "Missing key sessionID"). Đã test 200 OK thực tế.
- `POST /session/{sid}/prompt_async` body `{parts:[{type:'text',text}], model?, agent?}`, `POST /session/{sid}/abort`, `GET /permission`, `POST /permission/{rid}/reply` body `{reply:"once"|"always"|"reject"}`, `GET /project`, `GET /config/providers`, `GET /agent`, `GET /file?path=`, `GET /file/content?path=`, `GET /global/event` (SSE), `GET /session/{sid}/diff`.

**4. Trạng thái + bug vừa fix (commit `ded387d`):**
- Fix 400 PATCH (gửi full part), fix editor tự tắt khi click ngoài/drag chọn text (giờ chỉ tắt bằng Cancel/Esc), nút Edit luôn thấy (opacity 0.35, hover full).
- Đã test end-to-end: nút Edit hiện đúng, popup mở đúng, Save PATCH 200 và reload hiện text mới `[GASLIGHT TEST]...`.
- Việc còn treo duy nhất: browser cũ vẫn chạy gaslight v1 do cache (server serve đúng v2, check `fetch('/gaslight.js').text().includes('Gaslight v2 loaded')===true`). Chỉ cần hard refresh / tab mới là xong, không cần sửa code.

**5. Yêu cầu cho phiên này:**
Đọc 3 file `bin/cli.js`, `web/opencode-original/index.html`, `web/opencode-original/gaslight.js` trước khi làm. Chạy `opencode webui`, test ở http://localhost:3456, sửa tiếp theo yêu cầu của tôi. Mỗi lần sửa xong: `git add .; git commit -m "..."; git push origin master`. Không tự ý đổi UI gốc, không thêm theme.

Bắt đầu bằng cách xác nhận đã hiểu kiến trúc + đọc đủ 3 file trên.
