# OpenCode WebUI Pro 🚀

Giao diện Web UI cao cấp, đa tính năng dành riêng cho **OpenCode** mà không làm thay đổi hay can thiệp vào mã nguồn gốc của OpenCode.

![OpenCode WebUI](https://img.shields.io/badge/OpenCode-WebUI-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React_19-Vite_8-cyan?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS_v4-violet?style=for-the-badge)

---

## ✨ Tính năng nổi bật

- ⚡ **Kích hoạt tức thì**: Gõ `opencode webui` mở ngay giao diện Web UI tùy chỉnh trên trình duyệt.
- 💬 **Giao diện Chat trực quan**: Hiển thị realtime tiến trình suy nghĩ (Thinking), Model, Token usage, Cost và kết quả sinh code.
- 🛠️ **Hộp thoại duyệt lệnh (Permissions/Approvals)**: Dễ dàng xem, kiểm duyệt hoặc từ chối mọi yêu cầu chạy bash / sửa file của AI chỉ bằng một cú click.
- 📁 **File Explorer & Code Viewer**: Xem cây thư mục dự án và đọc nhanh nội dung các tệp tin trong workspace.
- 🔄 **Quản lý phiên làm việc (Sessions)**: Tạo mới, chuyển đổi qua lại hoặc xóa các phiên làm việc dễ dàng.
- 🔒 **An toàn 100%**: Sử dụng trực tiếp API Server headless của OpenCode, không làm ảnh hưởng đến dữ liệu hay cấu hình gốc.

---

## 🚀 Hướng dẫn cài đặt & Kích hoạt

### Cách 1: Sử dụng qua npm link
```bash
git clone https://github.com/nhatnamdev662/opencode-webui.git
cd opencode-webui
npm install
npm run build
npm link
```

### Cách 2: Tích hợp trực tiếp lệnh `opencode webui`
Bạn chỉ cần thêm function sau vào PowerShell Profile (`$PROFILE`) hoặc `.bashrc`:

```powershell
function opencode {
    if ($args[0] -eq "webui" -or $args[0] -eq "ui") {
        node "E:\crack\opencode-webui\bin\cli.js" @args
    } else {
        & "C:\Users\MAY1\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe" @args
    }
}
```

Bây giờ bạn chỉ cần gõ ở bất kỳ thư mục dự án nào:
```bash
opencode webui
```
-> Tự động kết nối OpenCode server và mở Web UI ngay trên trình duyệt!

---

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite 8, TailwindCSS v4, Lucide Icons.
- **Backend Connector**: Node.js CLI, HTTP REST & Server-Sent Events (SSE) Client.

---
Phát triển bởi **nhatnamdev662**.
