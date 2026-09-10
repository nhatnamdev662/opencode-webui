# COPY-PASTE CHO AI MỚI (Phiên tiếp theo)

> Copy toàn bộ khối dưới đây gửi cho AI mới để nó hiểu project ngay, không cần giải thích lại.

---

Chào AI, tiếp tục project `opencode-webui` của tôi.

**1. Mục tiêu project:**
Custom Web UI cho OpenCode, chạy bằng lệnh `opencode webui` (mở http://localhost:3456), KHÔNG sửa OpenCode gốc. UI phụ thuộc 100% API của OpenCode Core. Repo local: `E:\crack\opencode-webui`, GitHub: https://github.com/nhatnamdev662/opencode-webui (branch master, commit mới nhất `fe50352`).

**2. Kiến trúc hiện tại:**
- `bin/cli.js` = Node HTTP server thuần (không dep ngoài): serve static từ `web/opencode-original/` + reverse proxy mọi API về OpenCode Core (tự dò port qua `/path`: 52987/4096/...), tự spawn `opencode serve` nếu chưa chạy. Có RAM cache + gzip + 304 + SPA fallback (mọi route HTML trả về index.html local).
- `web/opencode-original/` = bundle gốc OpenCode tải về (index.html + assets/index-BpB7SL4b.js 2.7MB + CSS + dialog-settings...). index.html đã inject `window.__OPENCODE_API_BASE__` + `<script src="/gaslight.js">` + preload.
- `web/opencode-original/gaslight.js` (v3) = tính năng chỉnh sửa tin nhắn assistant: intercept `window.fetch` cache message list, tìm chính xác theo `data-timeline-part-id` trên DOM OpenCode. Nút Edit đặt ở DƯỚI đoạn chat (ngang hàng nút Copy response trong `text-part-copy-wrapper`) và ở DƯỚI đoạn thinking/reasoning (trong footer `gaslight-reasoning-footer`). Không đè lên chữ, không chèn giữa paragraph. Popup editor Save gọi `PATCH /session/{sid}/message/{mid}/part/{pid}`.
- Hook lệnh `opencode webui` đã cài ở `C:\Users\MAY1\AppData\Roaming\npm\opencode.cmd` và `opencode.ps1`.

**3. API quan trọng (OpenAPI ở `GET /doc`, 162 paths, đã verify):**
- `GET /session/{sid}/message` → lấy messages + parts (mỗi part có `id, type, text, sessionID, messageID`).
- `PATCH /session/{sid}/message/{mid}/part/{pid}` → **body BẮT BUỘC phải là full part object + text mới, gồm `sessionID, messageID, id, type, text`** (thiếu là 400 "Missing key sessionID"). Đã test 200 OK thực tế.
- `POST /session/{sid}/prompt_async` body `{parts:[{type:'text',text}], model?, agent?}`, `POST /session/{sid}/abort`, `GET /permission`, `POST /permission/{rid}/reply` body `{reply:"once"|"always"|"reject"}`, `GET /project`, `GET /config/providers`, `GET /agent`, `GET /file?path=`, `GET /file/content?path=`, `GET /global/event` (SSE), `GET /session/{sid}/diff`.

**4. Trạng thái + tính năng v3:**
- Đặt nút Edit ở DƯỚI đoạn chat của agent (trong action bar cùng hàng với nút Copy).
- Đặt nút Edit ở DƯỚI đoạn thinking (trong footer riêng bên dưới khối thinking).
- Thay thế hoàn toàn tìm kiếm `TreeWalker` cũ bằng selector chuẩn `[data-component="text-part"]` và `[data-component="reasoning-part"]` dựa vào `data-timeline-part-id`.
- Tự động bật `showReasoningSummaries` trong `settings.v3` nếu đang tắt để thinking luôn hiển thị.
- Cập nhật thời gian thực không cần F5/reload: Khi Save thành công, OpenCode Core dispatch event SSE giúp SolidJS cập nhật ngay văn bản trên màn hình, bỏ hoàn toàn lệnh `window.location.reload()`.
- Fix triệt để cache: `bin/cli.js` gửi `no-cache` cho `gaslight.js` + script thêm query version giúp cập nhật code tức thì không bị browser giữ cache cũ.

**5. Yêu cầu cho phiên này:**
Đọc 3 file `bin/cli.js`, `web/opencode-original/index.html`, `web/opencode-original/gaslight.js` trước khi làm. Chạy `opencode webui`, test ở http://localhost:3456, sửa tiếp theo yêu cầu của tôi. Mỗi lần sửa xong: `git add .; git commit -m "..."; git push origin master`. Không tự ý đổi UI gốc, không thêm theme.

Bắt đầu bằng cách xác nhận đã hiểu kiến trúc + đọc đủ 3 file trên.
