// OpenCode WebUI Smart Auto-Pilot & Security Guard v1.0
// - Event-driven SSE: Lắng nghe /global/event bắt trực tiếp sự kiện permission.asked realtime
// - Smart Rule Engine: Whitelist lệnh an toàn (git status, test, read, inspect) và Blacklist lệnh nguy hiểm
// - Cyber-HUD Floating Pill: Điều khiển chế độ (Smart / Full / Off), xem thống kê và Audit Log thời gian thực
// - Zero DOM Conflict: Tự động gắn kết cô lập, không ảnh hưởng SolidJS của OpenCode

(function() {
  'use strict';

  const STORAGE_KEY = 'opencode_autopilot_config';
  const LOGS_KEY = 'opencode_autopilot_logs';

  const DEFAULT_CONFIG = {
    mode: 'smart', // 'smart' | 'full' | 'off'
    notify: true,
    autoApproveCount: 0,
    blockedCount: 0
  };

  function loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_CONFIG };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {}
  }

  function loadLogs() {
    try {
      const raw = localStorage.getItem(LOGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveLogs(logs) {
    try {
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 60)));
    } catch {}
  }

  let state = {
    config: loadConfig(),
    logs: loadLogs(),
    sseConnected: false,
    panelOpen: false
  };

  // Blacklist regex: Không bao giờ auto-approve
  const DANGEROUS_PATTERNS = [
    /\b(rm\s+-[a-zA-Z]*r|rmdir|Remove-Item\s+.*-Recurse|del\s+\/s)\b/i,
    /\b(drop\s+(database|table|schema)|truncate\s+table)\b/i,
    /\b(git\s+(push|reset\s+--hard|clean\s+-[a-zA-Z]*f|rebase))\b/i,
    /\b(chmod\s+777|chown|kill\s+-9|taskkill\s+\/f)\b/i,
    /(curl|wget)\s+.*\|\s*(sh|bash|powershell|cmd)/i,
    /\b(format\s+[a-zA-Z]:|diskpart|reg\s+delete)\b/i
  ];

  // Whitelist regex: Được duyệt trong chế độ 'smart'
  const SAFE_PATTERNS = [
    /^git\s+(status|diff|log|branch|show|rev-parse|describe|check-ignore|config\s+--get)/i,
    /^(cat|ls|dir|find|grep|rg|findstr|head|tail|wc|pwd|echo|which|where)\b/i,
    /^(Get-ChildItem|Get-Content|Test-Path|Select-String|Get-Location)\b/i,
    /^(npm\s+(test|run\s+(test|lint|typecheck|build|check)|list)|yarn\s+(test|build)|pnpm\s+(test|build)|tsc|cargo\s+(check|test|build)|pytest|python\s+-m\s+unittest|go\s+(test|vet))\b/i,
    /^node\s+(-v|--version|-e\s+["'].*["'])$/i
  ];

  // Đánh giá quyền
  function evaluatePermission(req) {
    if (state.config.mode === 'off') {
      return { approve: false, reason: 'Auto-Pilot tắt (Chế độ duyệt thủ công)' };
    }

    const permType = (req.permission || req.action || '').toLowerCase();
    const cmd = req.metadata?.command || (req.patterns && req.patterns.join(' ')) || '';

    // Kiểm tra Blacklist trước
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(cmd)) {
        return { approve: false, reason: 'Lệnh có rủi ro cao (trong danh sách cảnh báo an toàn)' };
      }
    }

    // Quyền đọc file luôn an toàn
    if (permType === 'read' || permType === 'file_read') {
      return { approve: true, reason: 'Đọc file dự án (An toàn)' };
    }

    // Chế độ Smart: Kiểm tra Whitelist
    if (state.config.mode === 'smart') {
      for (const pattern of SAFE_PATTERNS) {
        if (pattern.test(cmd.trim())) {
          return { approve: true, reason: 'Lệnh an toàn trong Whitelist (' + pattern.source.slice(0, 25) + '...)' };
        }
      }
      return { approve: false, reason: 'Cần xác nhận từ người dùng' };
    }

    // Chế độ Full: Duyệt hết mọi thứ ngoại trừ Blacklist
    if (state.config.mode === 'full') {
      return { approve: true, reason: 'Chế độ Full-Auto đã kích hoạt' };
    }

    return { approve: false, reason: 'Mặc định giữ lại' };
  }

  const processedRequests = new Set();

  async function handlePermission(req) {
    const id = req.id;
    if (!id || processedRequests.has(id)) return;
    processedRequests.add(id);

    const evaluation = evaluatePermission(req);
    const cmd = req.metadata?.command || (req.patterns && req.patterns.join(' ')) || req.permission || 'Permission Request';

    if (evaluation.approve) {
      try {
        const resp = await fetch('/permission/' + encodeURIComponent(id) + '/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reply: 'once' })
        });

        if (resp.ok) {
          state.config.autoApproveCount++;
          saveConfig(state.config);

          addLog({
            id,
            time: new Date().toLocaleTimeString(),
            cmd: cmd.slice(0, 80),
            action: 'approved',
            reason: evaluation.reason
          });

          if (state.config.notify) {
            showToast('⚡ Auto-Pilot approved: ' + cmd.slice(0, 40), 'success');
          }
          renderHUD();
        }
      } catch (err) {
        console.error('[Auto-Pilot] Error replying permission:', err);
      }
    } else {
      state.config.blockedCount++;
      saveConfig(state.config);

      addLog({
        id,
        time: new Date().toLocaleTimeString(),
        cmd: cmd.slice(0, 80),
        action: 'held',
        reason: evaluation.reason
      });

      if (state.config.mode !== 'off') {
        showToast('🛡️ Giữ lệnh chờ duyệt: ' + cmd.slice(0, 35), 'warning');
      }
      renderHUD();
    }
  }

  function addLog(item) {
    state.logs.unshift(item);
    if (state.logs.length > 50) state.logs.pop();
    saveLogs(state.logs);
    renderPanelContent();
  }

  // Check pending permissions ban đầu
  async function pollPendingPermissions() {
    try {
      const res = await fetch('/permission');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          for (const p of list) {
            handlePermission(p);
          }
        }
      }
    } catch {}
  }

  // Kết nối SSE /global/event
  let eventSource = null;
  function connectSSE() {
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource('/global/event');

    eventSource.onopen = function() {
      state.sseConnected = true;
      renderHUD();
      pollPendingPermissions();
    };

    eventSource.onmessage = function(e) {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'permission.asked' || data.type === 'permission.v2.asked') {
          if (data.properties) {
            handlePermission(data.properties);
          }
        }
      } catch {}
    };

    eventSource.onerror = function() {
      state.sseConnected = false;
      renderHUD();
      setTimeout(connectSSE, 5000);
    };
  }

  // UI STYLES
  const STYLE = document.createElement('style');
  STYLE.textContent = `
    .opencode-autopilot-hud {
      position: fixed;
      top: 10px;
      right: 85px;
      z-index: 99990;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;
    }
    .autopilot-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 28px;
      padding: 0 10px;
      border-radius: 14px;
      font-size: 11.5px;
      font-weight: 500;
      color: #e6edf3;
      background: rgba(22, 27, 34, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(240, 246, 252, 0.12);
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .autopilot-pill:hover {
      background: rgba(33, 38, 45, 0.95);
      border-color: rgba(240, 246, 252, 0.25);
      transform: translateY(-1px);
    }
    .autopilot-led {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #238636;
      box-shadow: 0 0 6px #2ea043;
      display: inline-block;
    }
    .autopilot-led.smart {
      background: #2ea043;
      box-shadow: 0 0 7px #2ea043;
      animation: autopilot-pulse 2.2s infinite ease-in-out;
    }
    .autopilot-led.full {
      background: #1f6feb;
      box-shadow: 0 0 7px #58a6ff;
      animation: autopilot-pulse 1.6s infinite ease-in-out;
    }
    .autopilot-led.off {
      background: #6e7681;
      box-shadow: none;
      animation: none;
    }
    .autopilot-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 8px;
      background: rgba(56, 139, 253, 0.2);
      color: #58a6ff;
      font-size: 10px;
      font-weight: 600;
    }
    @keyframes autopilot-pulse {
      0%, 100% { opacity: 0.9; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(0.85); }
    }

    /* DROPDOWN PANEL */
    .autopilot-panel {
      position: absolute;
      top: 36px;
      right: 0;
      width: 330px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 10px;
      box-shadow: 0 16px 36px rgba(0,0,0,0.6);
      display: none;
      flex-direction: column;
      overflow: hidden;
      color: #c9d1d9;
      font-size: 12px;
      animation: autopilot-dropdown 0.15s ease-out;
    }
    .autopilot-panel.show {
      display: flex;
    }
    @keyframes autopilot-dropdown {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .autopilot-panel-header {
      padding: 10px 14px;
      background: #161b22;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .autopilot-panel-title {
      font-weight: 600;
      color: #f0f6fc;
      font-size: 12.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .autopilot-mode-selector {
      display: flex;
      padding: 10px 14px;
      gap: 6px;
      background: #0d1117;
      border-bottom: 1px solid #21262d;
    }
    .autopilot-mode-btn {
      flex: 1;
      padding: 6px 0;
      font-size: 11px;
      font-weight: 500;
      border-radius: 6px;
      border: 1px solid #30363d;
      background: #161b22;
      color: #8b949e;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s;
    }
    .autopilot-mode-btn:hover {
      color: #c9d1d9;
      border-color: #8b949e;
    }
    .autopilot-mode-btn.active.smart {
      background: rgba(46, 160, 67, 0.18);
      border-color: #2ea043;
      color: #3fb950;
    }
    .autopilot-mode-btn.active.full {
      background: rgba(31, 111, 235, 0.18);
      border-color: #388bfd;
      color: #58a6ff;
    }
    .autopilot-mode-btn.active.off {
      background: rgba(110, 118, 129, 0.2);
      border-color: #6e7681;
      color: #e6edf3;
    }
    .autopilot-stats {
      display: flex;
      padding: 8px 14px;
      background: #161b22;
      font-size: 11px;
      color: #8b949e;
      justify-content: space-between;
      border-bottom: 1px solid #21262d;
    }
    .autopilot-logs-container {
      max-height: 200px;
      overflow-y: auto;
      padding: 6px 0;
    }
    .autopilot-log-row {
      padding: 6px 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .autopilot-log-row:hover {
      background: rgba(255,255,255,0.02);
    }
    .autopilot-log-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: monospace;
      font-size: 11px;
    }
    .autopilot-log-tag {
      font-size: 9.5px;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .autopilot-log-tag.approved {
      background: rgba(46, 160, 67, 0.15);
      color: #3fb950;
      border: 1px solid rgba(46, 160, 67, 0.3);
    }
    .autopilot-log-tag.held {
      background: rgba(210, 153, 34, 0.15);
      color: #e3b341;
      border: 1px solid rgba(210, 153, 34, 0.3);
    }
    .autopilot-log-cmd {
      color: #e6edf3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 220px;
    }
    .autopilot-log-reason {
      font-size: 10px;
      color: #6e7681;
    }
    .autopilot-empty-log {
      padding: 24px;
      text-align: center;
      color: #6e7681;
      font-size: 11px;
    }
    .autopilot-panel-footer {
      padding: 8px 14px;
      background: #161b22;
      border-top: 1px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
    }
    .autopilot-clear-btn {
      background: none;
      border: none;
      color: #8b949e;
      cursor: pointer;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .autopilot-clear-btn:hover {
      color: #f85149;
    }

    /* TOAST */
    .autopilot-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(13, 17, 23, 0.95);
      color: #f0f6fc;
      border: 1px solid #30363d;
      border-left: 3px solid #2ea043;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-family: monospace;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      z-index: 99999;
      pointer-events: none;
      animation: autopilot-toast-in 0.2s ease-out;
    }
    .autopilot-toast.warning {
      border-left-color: #d29922;
    }
    @keyframes autopilot-toast-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(STYLE);

  function showToast(text, type = 'success') {
    const el = document.createElement('div');
    el.className = 'autopilot-toast ' + type;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }

  // Mount UI
  let hudContainer = null;
  let pillEl = null;
  let panelEl = null;

  function initUI() {
    if (document.getElementById('opencode-autopilot-root')) return;

    hudContainer = document.createElement('div');
    hudContainer.id = 'opencode-autopilot-root';
    hudContainer.className = 'opencode-autopilot-hud';

    pillEl = document.createElement('div');
    pillEl.className = 'autopilot-pill';
    pillEl.title = 'OpenCode Auto-Pilot & Security Guard';

    panelEl = document.createElement('div');
    panelEl.className = 'autopilot-panel';

    hudContainer.appendChild(pillEl);
    hudContainer.appendChild(panelEl);
    document.body.appendChild(hudContainer);

    pillEl.addEventListener('click', (e) => {
      e.stopPropagation();
      state.panelOpen = !state.panelOpen;
      renderPanel();
    });

    document.addEventListener('click', (e) => {
      if (state.panelOpen && !hudContainer.contains(e.target)) {
        state.panelOpen = false;
        renderPanel();
      }
    });

    renderHUD();
    renderPanelContent();
  }

  function renderHUD() {
    if (!pillEl) return;
    const mode = state.config.mode;
    const count = state.config.autoApproveCount || 0;
    const modeLabel = mode === 'smart' ? 'Smart' : mode === 'full' ? 'Full' : 'Off';

    pillEl.innerHTML = `
      <span class="autopilot-led ${mode}"></span>
      <span>Auto-Pilot: <b>${modeLabel}</b></span>
      ${count > 0 ? `<span class="autopilot-badge">${count}</span>` : ''}
    `;
  }

  function renderPanel() {
    if (!panelEl) return;
    if (state.panelOpen) {
      panelEl.classList.add('show');
      renderPanelContent();
    } else {
      panelEl.classList.remove('show');
    }
  }

  function renderPanelContent() {
    if (!panelEl) return;
    const currentMode = state.config.mode;

    panelEl.innerHTML = `
      <div class="autopilot-panel-header">
        <div class="autopilot-panel-title">
          <span>🛡️ Auto-Pilot & Security Guard</span>
        </div>
        <div style="font-size: 10px; color: ${state.sseConnected ? '#3fb950' : '#8b949e'}">
          ${state.sseConnected ? '● Live' : '○ Connecting'}
        </div>
      </div>

      <div class="autopilot-mode-selector">
        <button class="autopilot-mode-btn smart ${currentMode === 'smart' ? 'active' : ''}" data-mode="smart">
          Smart Safe
        </button>
        <button class="autopilot-mode-btn full ${currentMode === 'full' ? 'active' : ''}" data-mode="full">
          Full Auto
        </button>
        <button class="autopilot-mode-btn off ${currentMode === 'off' ? 'active' : ''}" data-mode="off">
          Manual Off
        </button>
      </div>

      <div class="autopilot-stats">
        <span>Đã duyệt tự động: <b style="color:#3fb950">${state.config.autoApproveCount}</b></span>
        <span>Giữ duyệt tay: <b style="color:#e3b341">${state.config.blockedCount}</b></span>
      </div>

      <div class="autopilot-logs-container">
        ${state.logs.length === 0 ? `
          <div class="autopilot-empty-log">Chưa có hoạt động nào được ghi lại.</div>
        ` : state.logs.map(log => `
          <div class="autopilot-log-row">
            <div class="autopilot-log-top">
              <span class="autopilot-log-cmd" title="${log.cmd}">${log.cmd}</span>
              <span class="autopilot-log-tag ${log.action}">${log.action === 'approved' ? 'Approved' : 'Held'}</span>
            </div>
            <div class="autopilot-log-reason">
              ${log.time} • ${log.reason}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="autopilot-panel-footer">
        <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
          <input type="checkbox" id="autopilot-notify-chk" ${state.config.notify ? 'checked' : ''} />
          <span>Thông báo Toast</span>
        </label>
        <button class="autopilot-clear-btn" id="autopilot-clear-logs">Xóa lịch sử</button>
      </div>
    `;

    // Event listeners cho panel
    panelEl.querySelectorAll('.autopilot-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const m = btn.getAttribute('data-mode');
        state.config.mode = m;
        saveConfig(state.config);
        renderHUD();
        renderPanelContent();
        showToast('Auto-Pilot chuyển sang: ' + m.toUpperCase(), 'success');
      });
    });

    const notifyChk = panelEl.querySelector('#autopilot-notify-chk');
    if (notifyChk) {
      notifyChk.addEventListener('change', (e) => {
        state.config.notify = e.target.checked;
        saveConfig(state.config);
      });
    }

    const clearBtn = panelEl.querySelector('#autopilot-clear-logs');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.logs = [];
        state.config.autoApproveCount = 0;
        state.config.blockedCount = 0;
        saveConfig(state.config);
        saveLogs(state.logs);
        renderHUD();
        renderPanelContent();
      });
    }
  }

  // Khởi động
  function start() {
    initUI();
    connectSSE();
    setInterval(pollPendingPermissions, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  console.log('[OpenCode WebUI] Smart Auto-Pilot & Security Guard v1.0 initialized');
})();
