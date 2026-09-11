#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

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
    console.log('\x1b[36m%s\x1b[0m', '⚡ Khởi động OpenCode WebUI (High Performance Mode)...');

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

    const staticDir = path.join(__dirname, '../web/opencode-original');

    // In-memory static cache và Gzip pre-compression để load tức thì 0ms
    const memoryCache = new Map();

    function getCachedFile(filePath) {
      const stat = fs.statSync(filePath);
      const cacheKey = filePath + ':' + stat.mtimeMs;
      if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey);
      }

      const raw = fs.readFileSync(filePath);
      const gzip = zlib.gzipSync(raw, { level: 6 });
      const record = { raw, gzip, mtime: stat.mtime.toUTCString() };
      memoryCache.set(cacheKey, record);
      return record;
    }

    const mimeMap = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.ico': 'image/x-icon',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
      '.ttf': 'font/ttf',
      '.webmanifest': 'application/manifest+json'
    };

    function runGit(cmd, cwd) {
      return new Promise((resolve) => {
        exec(cmd, { cwd, maxBuffer: 10 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
          resolve({
            error: err ? err.message : null,
            code: err ? err.code : 0,
            stdout: stdout || '',
            stderr: stderr || ''
          });
        });
      });
    }

    function parseJsonBody(req) {
      return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
          if (body.length > 5 * 1024 * 1024) req.destroy();
        });
        req.on('end', () => {
          try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); }
        });
        req.on('error', () => resolve({}));
      });
    }

    function sendJson(res, statusCode, data) {
      const json = JSON.stringify(data);
      res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': '*'
      });
      res.end(json);
    }

    async function handleExtensionApi(req, res, cleanUrl) {
      try {
        const parsedUrl = new URL(req.url, 'http://127.0.0.1');
        const query = Object.fromEntries(parsedUrl.searchParams.entries());

        if (cleanUrl === '/opencode-ext/git/status') {
          const targetDir = path.resolve(query.directory || process.cwd());
          const isGitRes = await runGit('git rev-parse --is-inside-work-tree', targetDir);
          const isGit = !isGitRes.error && isGitRes.stdout.trim() === 'true';

          if (!isGit) {
            return sendJson(res, 200, {
              isGit: false,
              directory: targetDir,
              branch: '',
              files: [],
              totalChanges: 0,
              totalAdditions: 0,
              totalDeletions: 0
            });
          }

          const branchRes = await runGit('git branch --show-current', targetDir);
          const branch = branchRes.stdout.trim() || 'HEAD';

          const statusRes = await runGit('git -c core.quotepath=false status --porcelain=v1 -uall', targetDir);
          const numstatRes = await runGit('git diff --numstat HEAD', targetDir);
          const numstatMap = {};
          numstatRes.stdout.split('\n').filter(Boolean).forEach(line => {
            const parts = line.split('\t');
            if (parts.length >= 3) {
              const adds = parseInt(parts[0], 10) || 0;
              const dels = parseInt(parts[1], 10) || 0;
              const filePath = parts.slice(2).join('\t').trim();
              numstatMap[filePath] = { additions: adds, deletions: dels };
            }
          });

          let totalAdditions = 0;
          let totalDeletions = 0;
          const files = [];

          const lines = statusRes.stdout.split('\n').filter(Boolean);
          for (const line of lines) {
            const x = line[0];
            const y = line[1];
            let filePath = line.substring(3).trim();
            if (filePath.startsWith('"') && filePath.endsWith('"')) {
              filePath = filePath.slice(1, -1);
            }

            let status = 'modified';
            if (x === '?' || y === '?') status = 'untracked';
            else if (x === 'D' || y === 'D') status = 'deleted';
            else if (x === 'A' || y === 'A') status = 'added';
            else if (x === 'R' || y === 'R') status = 'renamed';

            let additions = numstatMap[filePath]?.additions || 0;
            let deletions = numstatMap[filePath]?.deletions || 0;

            if (status === 'untracked') {
              try {
                const fullPath = path.join(targetDir, filePath);
                if (fs.existsSync(fullPath) && !fs.statSync(fullPath).isDirectory()) {
                  const content = fs.readFileSync(fullPath, 'utf8');
                  additions = content.split('\n').length;
                }
              } catch {}
            }

            totalAdditions += additions;
            totalDeletions += deletions;

            files.push({
              file: filePath,
              status,
              staged: x !== ' ' && x !== '?',
              rawCode: x + y,
              additions,
              deletions
            });
          }

          return sendJson(res, 200, {
            isGit: true,
            directory: targetDir,
            branch,
            files,
            totalChanges: files.length,
            totalAdditions,
            totalDeletions
          });
        }

        if (cleanUrl === '/opencode-ext/git/diff') {
          const targetDir = path.resolve(query.directory || process.cwd());
          const file = query.file;

          if (file) {
            const fullPath = path.join(targetDir, file);
            const st = await runGit(`git -c core.quotepath=false status --porcelain -- "${file}"`, targetDir);
            const code = st.stdout.trim().slice(0, 2);

            let diffOutput = '';
            if (code.includes('?')) {
              const diffRes = await runGit(`git -c core.quotepath=false diff --no-index -- /dev/null "${file}"`, targetDir);
              diffOutput = diffRes.stdout || '';
            } else {
              const diffRes = await runGit(`git -c core.quotepath=false diff HEAD -- "${file}"`, targetDir);
              diffOutput = diffRes.stdout || '';
            }

            return sendJson(res, 200, { file, diff: diffOutput });
          } else {
            const diffRes = await runGit('git -c core.quotepath=false diff HEAD', targetDir);
            return sendJson(res, 200, { diff: diffRes.stdout || '' });
          }
        }

        if (cleanUrl === '/opencode-ext/git/revert' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const targetDir = path.resolve(body.directory || process.cwd());

          if (body.all) {
            await runGit('git checkout HEAD -- .', targetDir);
            await runGit('git clean -fd', targetDir);
            return sendJson(res, 200, { ok: true, message: 'Đã hoàn tác toàn bộ thay đổi dự án.' });
          }

          if (body.file) {
            const file = body.file;
            const fullPath = path.join(targetDir, file);
            const st = await runGit(`git -c core.quotepath=false status --porcelain -- "${file}"`, targetDir);
            const code = st.stdout.trim().slice(0, 2);

            if (code.includes('?')) {
              try {
                if (fs.existsSync(fullPath)) {
                  if (fs.statSync(fullPath).isDirectory()) fs.rmSync(fullPath, { recursive: true, force: true });
                  else fs.unlinkSync(fullPath);
                }
              } catch (e) {
                return sendJson(res, 500, { ok: false, error: e.message });
              }
            } else {
              await runGit(`git checkout HEAD -- "${file}"`, targetDir);
            }
            return sendJson(res, 200, { ok: true, message: `Đã hoàn tác: ${file}` });
          }

          return sendJson(res, 400, { ok: false, error: 'Thiếu tham số file hoặc all' });
        }

        if (cleanUrl === '/opencode-ext/git/init' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const targetDir = path.resolve(body.directory || process.cwd());
          const initRes = await runGit('git init', targetDir);
          if (initRes.error) {
            return sendJson(res, 500, { ok: false, error: initRes.error });
          }
          return sendJson(res, 200, { ok: true, message: 'Đã khởi tạo Git repository thành công.' });
        }

        // ==========================================
        // ROUTER & PROVIDER MANAGER ENDPOINTS
        // ==========================================

        const OPENCODE_CONFIG_PATH = path.join(
          process.env.USERPROFILE || 'C:\\Users\\MAY1',
          '.config', 'opencode', 'opencode.json'
        );

        let sqliteDb = null;
        function getSqliteDb() {
          if (sqliteDb) return sqliteDb;
          try {
            const { DatabaseSync } = require('node:sqlite');
            const dbPath = path.join(
              process.env.APPDATA || (process.env.USERPROFILE + '\\AppData\\Roaming'),
              '9router', 'db', 'data.sqlite'
            );
            if (fs.existsSync(dbPath)) {
              sqliteDb = new DatabaseSync(dbPath, { readOnly: true });
            }
          } catch (e) {
            console.warn('[Router Backend] SQLite not available:', e.message);
          }
          return sqliteDb;
        }

        function formatTimeAgo(dateStr) {
          if (!dateStr) return '';
          const diff = Date.now() - new Date(dateStr).getTime();
          const sec = Math.floor(diff / 1000);
          if (sec < 60) return `${Math.max(1, sec)}s ago`;
          const min = Math.floor(sec / 60);
          if (min < 60) return `${min}m ago`;
          const hr = Math.floor(min / 60);
          if (hr < 24) return `${hr}h ago`;
          const d = Math.floor(hr / 24);
          return `${d}d ago`;
        }

        if (cleanUrl === '/opencode-ext/router/stats') {
          const range = query.range || 'today';
          const db = getSqliteDb();

          if (db) {
            let where = '1=1';
            const now = new Date();
            if (range === 'today') {
              const todayStr = now.toISOString().slice(0, 10);
              where = `timestamp LIKE '${todayStr}%'`;
            } else if (range === '24h') {
              const d = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
              where = `timestamp >= '${d}'`;
            } else if (range === '7d') {
              const d = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
              where = `timestamp >= '${d}'`;
            } else if (range === '30d') {
              const d = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
              where = `timestamp >= '${d}'`;
            } else if (range === '60d') {
              const d = new Date(now.getTime() - 60 * 24 * 3600 * 1000).toISOString();
              where = `timestamp >= '${d}'`;
            }

            const row = db.prepare(`
              SELECT 
                COUNT(*) as totalRequests,
                COALESCE(SUM(promptTokens), 0) as totalInputTokens,
                COALESCE(SUM(completionTokens), 0) as outputTokens,
                COALESCE(SUM(cost), 0) as estCost
              FROM usageHistory
              WHERE ${where}
            `).get() || { totalRequests: 0, totalInputTokens: 0, outputTokens: 0, estCost: 0 };

            const tokenRows = db.prepare(`SELECT tokens FROM usageHistory WHERE ${where}`).all();
            let cachedTokens = 0;
            for (const t of tokenRows) {
              try { cachedTokens += JSON.parse(t.tokens).cached_tokens || 0; } catch {}
            }

            const recentRows = db.prepare(`
              SELECT model, provider, promptTokens, completionTokens, timestamp, cost
              FROM usageHistory
              ORDER BY id DESC
              LIMIT 25
            `).all();

            const recentRequests = recentRows.map(r => ({
              model: r.model || 'unknown',
              provider: r.provider || 'unknown',
              inTokens: r.promptTokens || 0,
              outTokens: r.completionTokens || 0,
              cost: r.cost || 0,
              timestamp: r.timestamp,
              timeAgo: formatTimeAgo(r.timestamp)
            }));

            const activeReq = recentRequests[0];
            const activeProvider = activeReq?.provider || 'antigravity';
            const activeModel = activeReq?.model || 'gemini-3.8-flash-high';

            return sendJson(res, 200, {
              range,
              totalRequests: row.totalRequests || 0,
              totalInputTokens: row.totalInputTokens || 0,
              cachedTokens,
              outputTokens: row.outputTokens || 0,
              estCost: row.estCost ? parseFloat(row.estCost.toFixed(2)) : 0,
              recentRequests,
              activeProvider,
              activeModel
            });
          } else {
            return sendJson(res, 200, {
              range,
              totalRequests: 0,
              totalInputTokens: 0,
              cachedTokens: 0,
              outputTokens: 0,
              estCost: 0,
              recentRequests: [],
              activeProvider: 'antigravity',
              activeModel: ''
            });
          }
        }

        if (cleanUrl === '/opencode-ext/router/topology') {
          const db = getSqliteDb();
          let activeProvider = 'antigravity';
          let activeModel = 'gemini-3.8-flash-high';

          if (db) {
            const latest = db.prepare('SELECT model, provider FROM usageHistory ORDER BY id DESC LIMIT 1').get();
            if (latest) {
              activeProvider = latest.provider || 'antigravity';
              activeModel = latest.model || 'gemini-3.8-flash-high';
            }
          }

          const hub = { id: '9router', name: '9Router', type: 'hub' };
          const nodes = [
            { id: 'bai', name: 'BAI', icon: 'bai', pos: 'top' },
            { id: 'antigravity', name: 'Antigravity', icon: 'antigravity', pos: 'right-top' },
            { id: 'openai-codex', name: 'OpenAI Codex', icon: 'openai', pos: 'right-bottom' },
            { id: 'openrouter', name: 'openrouter', icon: 'openrouter', pos: 'bottom' },
            { id: 'mimo-free', name: 'MiMo Code Free', icon: 'mimo', pos: 'left-bottom' },
            { id: 'opencode-free', name: 'OpenCode Free', icon: 'opencode', pos: 'left-top' }
          ];

          return sendJson(res, 200, {
            hub,
            nodes,
            activeProvider,
            activeModel
          });
        }

        if (cleanUrl === '/opencode-ext/router/providers') {
          let configData = { provider: {} };
          if (fs.existsSync(OPENCODE_CONFIG_PATH)) {
            try {
              configData = JSON.parse(fs.readFileSync(OPENCODE_CONFIG_PATH, 'utf8'));
            } catch {}
          }
          return sendJson(res, 200, {
            providers: configData.provider || {}
          });
        }

        if (cleanUrl === '/opencode-ext/router/providers/save' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          if (!body.id || !body.data) {
            return sendJson(res, 400, { ok: false, error: 'Thiếu id hoặc data' });
          }

          let configData = { provider: {} };
          if (fs.existsSync(OPENCODE_CONFIG_PATH)) {
            try {
              configData = JSON.parse(fs.readFileSync(OPENCODE_CONFIG_PATH, 'utf8'));
            } catch {}
            fs.copyFileSync(OPENCODE_CONFIG_PATH, OPENCODE_CONFIG_PATH + '.bak');
          }

          if (!configData.provider) configData.provider = {};
          configData.provider[body.id] = body.data;

          fs.writeFileSync(OPENCODE_CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf8');
          return sendJson(res, 200, { ok: true, message: `Đã lưu cấu hình provider ${body.id}` });
        }

        if (cleanUrl === '/opencode-ext/router/providers/delete' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          if (!body.id) return sendJson(res, 400, { ok: false, error: 'Thiếu id' });

          if (fs.existsSync(OPENCODE_CONFIG_PATH)) {
            let configData = JSON.parse(fs.readFileSync(OPENCODE_CONFIG_PATH, 'utf8'));
            if (configData.provider && configData.provider[body.id]) {
              fs.copyFileSync(OPENCODE_CONFIG_PATH, OPENCODE_CONFIG_PATH + '.bak');
              delete configData.provider[body.id];
              fs.writeFileSync(OPENCODE_CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf8');
              return sendJson(res, 200, { ok: true, message: `Đã xóa provider ${body.id}` });
            }
          }
          return sendJson(res, 404, { ok: false, error: 'Provider không tồn tại' });
        }

        if (cleanUrl === '/opencode-ext/router/scan' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          let targetUrl = body.baseURL || 'http://127.0.0.1:20128/v1';
          if (!targetUrl.endsWith('/models')) {
            targetUrl = targetUrl.replace(/\/+$/, '') + '/models';
          }

          const client = targetUrl.startsWith('https:') ? https : http;
          const headers = {};
          if (body.apiKey) headers['Authorization'] = `Bearer ${body.apiKey}`;

          client.get(targetUrl, { headers, timeout: 10000 }, (scanRes) => {
            let d = '';
            scanRes.on('data', c => d += c);
            scanRes.on('end', () => {
              try {
                const j = JSON.parse(d);
                const models = Array.isArray(j.data) ? j.data.map(m => m.id) : [];
                return sendJson(res, 200, { ok: true, models, count: models.length });
              } catch (e) {
                return sendJson(res, 500, { ok: false, error: 'Lỗi parse JSON từ /models' });
              }
            });
          }).on('error', (err) => {
            return sendJson(res, 500, { ok: false, error: err.message });
          });
          return;
        }

        if (cleanUrl === '/opencode-ext/router/ping' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          let targetUrl = body.baseURL || 'http://127.0.0.1:20128/v1';
          if (!targetUrl.endsWith('/models')) {
            targetUrl = targetUrl.replace(/\/+$/, '') + '/models';
          }

          const client = targetUrl.startsWith('https:') ? https : http;
          const headers = {};
          if (body.apiKey) headers['Authorization'] = `Bearer ${body.apiKey}`;

          const startTime = Date.now();
          client.get(targetUrl, { headers, timeout: 5000 }, (pingRes) => {
            let d = '';
            pingRes.on('data', c => d += c);
            pingRes.on('end', () => {
              const latency = Date.now() - startTime;
              const ok = pingRes.statusCode >= 200 && pingRes.statusCode < 400;
              return sendJson(res, 200, { ok, latency, statusCode: pingRes.statusCode });
            });
          }).on('error', (err) => {
            return sendJson(res, 200, { ok: false, latency: -1, error: err.message });
          });
          return;
        }

        return sendJson(res, 404, { error: 'Not found' });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }

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

      // Extension API
      if (cleanUrl.startsWith('/opencode-ext/')) {
        handleExtensionApi(req, res, cleanUrl);
        return;
      }

      // Static file serving với Cache-Control & Gzip Compression
      let localFilePath = path.join(staticDir, cleanUrl === '/' ? 'index.html' : cleanUrl);
      if (fs.existsSync(localFilePath) && !fs.statSync(localFilePath).isDirectory()) {
        try {
          const ext = path.extname(localFilePath);
          const cached = getCachedFile(localFilePath);

          // HTTP 304 Not Modified check
          if (req.headers['if-modified-since'] === cached.mtime) {
            res.writeHead(304);
            res.end();
            return;
          }

          const acceptEncoding = req.headers['accept-encoding'] || '';
          const isGzip = acceptEncoding.includes('gzip');

          const headers = {
            'Content-Type': mimeMap[ext] || 'application/octet-stream',
            'Last-Modified': cached.mtime,
            // Cache dài cho assets có hash, không cache cho index.html, gaslight.js, dialog-settings để luôn cập nhật
            'Cache-Control': (ext === '.html' || cleanUrl === '/gaslight.js' || cleanUrl.includes('dialog-settings')) ? 'no-cache' : 'public, max-age=31536000, immutable'
          };

          if (isGzip) {
            headers['Content-Encoding'] = 'gzip';
            res.writeHead(200, headers);
            res.end(cached.gzip);
          } else {
            res.writeHead(200, headers);
            res.end(cached.raw);
          }
          return;
        } catch (e) {
          // Fallback to stream if memory read fails
        }
      }

      // Proxy API requests về OpenCode Core Server (streaming SSE, REST)
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
        // SPA Fallback: mọi route HTML (kể cả 200 từ core) đều trả index.html local có gaslight
        const isHtmlRoute = (req.headers.accept && req.headers.accept.includes('text/html'))
          || (proxyRes.headers['content-type'] || '').includes('text/html');

        if (isHtmlRoute && !cleanUrl.startsWith('/assets/') && cleanUrl !== '/') {
          const indexHtml = path.join(staticDir, 'index.html');
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
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
      console.log('\x1b[35m%s\x1b[0m', `🌐 OpenCode Web UI siêu tốc sẵn sàng: ${targetUrl}`);
      console.log('Nhấn Ctrl+C để dừng.');

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
