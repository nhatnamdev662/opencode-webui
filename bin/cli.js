#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const OPENCODE_EXE = 'C:\\Users\\MAY1\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe';
const UI_PORT = 3456;

// Hàm kiểm tra port của OpenCode đang chạy
async function findActiveOpenCodePort() {
  const httpReq = (port) => new Promise((resolve) => {
    const req = http.get({
      hostname: '127.0.0.1',
      port,
      path: '/path',
      timeout: 400
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && (parsed.worktree || parsed.directory)) {
            return resolve(port);
          }
        } catch {}
        resolve(null);
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });

  // Check danh sách port thông dụng của opencode
  const candidatePorts = [52987, 4096, 53035, 53030, 53024, 53020, 51457, 51456, 51454, 51429, 51424];
  for (const p of candidatePorts) {
    const res = await httpReq(p);
    if (res) return res;
  }
  return null;
}

// Xử lý args truyền vào
const args = process.argv.slice(2);
const isWebUI = args.length > 0 && (args[0] === 'webui' || args[0] === 'ui');

if (!isWebUI) {
  // Chuyển tiếp 100% lệnh bình thường sang opencode.exe gốc
  const child = spawn(OPENCODE_EXE, args, {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  });
  child.on('exit', (code) => process.exit(code || 0));
} else {
  // Lệnh: opencode webui
  (async () => {
    console.log('\x1b[36m%s\x1b[0m', '⚡ Khởi động OpenCode WebUI Pro...');

    let opencodePort = await findActiveOpenCodePort();
    let opencodeProc = null;

    if (!opencodePort) {
      console.log('\x1b[33m%s\x1b[0m', '⏳ Đang khởi tạo OpenCode Server background...');
      opencodeProc = spawn(OPENCODE_EXE, ['serve', '--port', '4096'], {
        stdio: 'ignore',
        shell: true,
        detached: true,
        cwd: process.cwd(),
      });
      // Đợi server sẵn sàng
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 800));
        opencodePort = await findActiveOpenCodePort();
        if (opencodePort) break;
      }
    }

    if (!opencodePort) {
      opencodePort = 52987; // Fallback default
    }

    console.log('\x1b[32m%s\x1b[0m', `✓ Đã kết nối với OpenCode Core tại port: ${opencodePort}`);

    // Serve static Web UI đã build từ folder web/dist
    const distPath = path.join(__dirname, '../web/dist');
    const mimeMap = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.ico': 'image/x-icon',
    };

    const server = http.createServer((req, res) => {
      // Cho phép CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

      let reqUrl = req.url.split('?')[0];
      let filePath = path.join(distPath, reqUrl === '/' ? 'index.html' : reqUrl);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distPath, 'index.html'); // SPA fallback
      }

      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(UI_PORT, () => {
      const targetUrl = `http://localhost:${UI_PORT}?api=http://127.0.0.1:${opencodePort}`;
      console.log('\x1b[35m%s\x1b[0m', `🌐 Web UI đang chạy tại: ${targetUrl}`);
      console.log('Nhấn Ctrl+C để dừng Web UI.');

      // Tự động mở trình duyệt
      const opener = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
      spawn(opener, [targetUrl], { shell: true });
    });

    process.on('SIGINT', () => {
      console.log('\nĐang dừng Web UI...');
      if (opencodeProc && !opencodeProc.killed) {
        try { process.kill(-opencodeProc.pid); } catch {}
      }
      server.close();
      process.exit(0);
    });
  })();
}
