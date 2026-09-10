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
      timeout: 300
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

  const candidatePorts = [52987, 4096, 53035, 53030, 53024, 53020, 51457, 51456, 51454, 51429, 51424];
  for (const p of candidatePorts) {
    const res = await httpReq(p);
    if (res) return res;
  }
  return null;
}

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
  (async () => {
    console.log('\x1b[36m%s\x1b[0m', '⚡ Khởi động OpenCode WebUI (100% Full Features)...');

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
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 800));
        opencodePort = await findActiveOpenCodePort();
        if (opencodePort) break;
      }
    }

    if (!opencodePort) {
      opencodePort = 52987;
    }

    console.log('\x1b[32m%s\x1b[0m', `✓ Đã kết nối với OpenCode Core tại port: ${opencodePort}`);

    // Thư mục UI gốc 100%
    const staticDir = path.join(__dirname, '../web/opencode-original');

    const mimeMap = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.ico': 'image/x-icon',
      '.webmanifest': 'application/manifest+json'
    };

    // Tạo Reverse Proxy kết hợp Static Server:
    // Mọi API request (/session, /project, /file, /global/event, v.v.) tự động forward sang OpenCode Core
    // Mọi asset tĩnh và HTML được serve từ Web UI gốc để bạn thoải mái chỉnh sửa / thêm tính năng sau này!
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', '*');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const cleanUrl = req.url.split('?')[0];

      // Kiểm tra nếu là file tĩnh trong thư mục UI
      const localFilePath = path.join(staticDir, cleanUrl === '/' ? 'index.html' : cleanUrl);
      if (fs.existsSync(localFilePath) && !fs.statSync(localFilePath).isDirectory()) {
        const ext = path.extname(localFilePath);
        res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
        fs.createReadStream(localFilePath).pipe(res);
        return;
      }

      // Nếu không phải file tĩnh local, Proxy 100% request về OpenCode Core Server
      const proxyReq = http.request({
        hostname: '127.0.0.1',
        port: opencodePort,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: `127.0.0.1:${opencodePort}`,
        }
      }, (proxyRes) => {
        // Nếu là HTML fallback (SPA route) mà server core trả về 404 thì trả index.html local
        if (proxyRes.statusCode === 404 && req.headers.accept && req.headers.accept.includes('text/html')) {
          const indexHtml = path.join(staticDir, 'index.html');
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(indexHtml).pipe(res);
          return;
        }

        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });

      proxyReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Bad Gateway: ' + err.message);
      });

      req.pipe(proxyReq, { end: true });
    });

    server.listen(UI_PORT, () => {
      const targetUrl = `http://localhost:${UI_PORT}`;
      console.log('\x1b[35m%s\x1b[0m', `🌐 Web UI 100% OpenCode đang chạy tại: ${targetUrl}`);
      console.log('Nhấn Ctrl+C để thoát.');

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
