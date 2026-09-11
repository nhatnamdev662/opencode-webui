// OpenCode WebUI Smart Auto-Pilot & Security Guard v2.0
// - Seamless Native Integration: Tích hợp trực tiếp vào #opencode-titlebar-right cùng hàng với các action button gốc
// - OpenCode Design System: Sử dụng đúng typography Inter, màu sắc, bo góc, layer background và shadow của OpenCode
// - SSE Event-Driven: Bắt realtime sự kiện permission.asked từ /global/event
// - Intelligent Rule Engine: Whitelist lệnh dev an toàn, Blacklist lệnh phá hoại nguy hiểm
// - Non-intrusive HUD: Popover menu mở ngay dưới nút, đóng mở mượt mà

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
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 40)));
    } catch {}
  }

  let state = {
    config: loadConfig(),
    logs: loadLogs(),
    sseConnected: false,
    panelOpen: false
  };

  // Blacklist patterns: Tuyệt đối không auto-approve ở bất kỳ mode nào
  const DANGEROUS_PATTERNS = [
    /\b(rm\s+-[a-zA-Z]*r|rmdir|Remove-Item\s+.*-Recurse|del\s+\/s)\b/i,
    /\b(drop\s+(database|table|schema)|truncate\s+table)\b/i,
    /\b(git\s+(push|reset\s+--hard|clean\s+-[a-zA-Z]*f|rebase))\b/i,
    /\b(chmod\s+777|chown|kill\s+-9|taskkill\s+\/f)\b/i,
    /(curl|wget)\s+.*\|\s*(sh|bash|powershell|cmd)/i,
    /\b(format\s+[a-zA-Z]:|diskpart|reg\s+delete)\b/i
  ];

  // Whitelist patterns: Được duyệt tự động trong chế độ 'smart'
  const SAFE_PATTERNS = [
    /^git\s+(status|diff|log|branch|show|rev-parse|describe|check-ignore|config\s+--get)/i,
    /^(cat|ls|dir|find|grep|rg|findstr|head|tail|wc|pwd|echo|which|where)\b/i,
    /^(Get-ChildItem|Get-Content|Test-Path|Select-String|Get-Location)\b/i,
    /^(npm\s+(test|run\s+(test|lint|typecheck|build|check)|list)|yarn\s+(test|build)|pnpm\s+(test|build)|tsc|cargo\s+(check|test|build)|pytest|python\s+-m\s+unittest|go\s+(test|vet))\b/i,
    /^node\s+(-v|--version|-e\s+["'].*["'])$/i
  ];

  function evaluatePermission(req) {
    if (state.config.mode === 'off') {
      return { approve: false, reason: 'Chế độ duyệt tay (Manual Off)' };
    }

    const permType = (req.permission || req.action || '').toLowerCase();
    const cmd = req.metadata?.command || (req.patterns && req.patterns.join(' ')) || '';

    // Kiểm tra Blacklist trước
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(cmd)) {
        return { approve: false, reason: 'Lệnh rủi ro cao (chặn bởi Blacklist)' };
      }
    }

    // Đọc file luôn an toàn
    if (permType === 'read' || permType === 'file_read') {
      return { approve: true, reason: 'Đọc tệp tin workspace' };
    }

    // Chế độ Smart
    if (state.config.mode === 'smart') {
      for (const pattern of SAFE_PATTERNS) {
        if (pattern.test(cmd.trim())) {
          return { approve: true, reason: 'Lệnh an toàn trong Whitelist' };
        }
      }
      return { approve: false, reason: 'Cần xác nhận từ người dùng' };
    }

    // Chế độ Full
    if (state.config.mode === 'full') {
      return { approve: true, reason: 'Chế độ Full Auto' };
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
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            cmd: cmd.slice(0, 75),
            action: 'approved',
            reason: evaluation.reason
          });

          if (state.config.notify) {
            showToast('Auto-approved: ' + cmd.slice(0, 36), 'success');
          }
          renderTriggerBtn();
        }
      } catch (err) {
        console.error('[Auto-Pilot] Error replying permission:', err);
      }
    } else {
      state.config.blockedCount++;
      saveConfig(state.config);

      addLog({
        id,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cmd: cmd.slice(0, 75),
        action: 'held',
        reason: evaluation.reason
      });

      if (state.config.mode !== 'off') {
        showToast('Yêu cầu duyệt thủ công: ' + cmd.slice(0, 32), 'warning');
      }
      renderTriggerBtn();
    }
  }

  function addLog(item) {
    state.logs.unshift(item);
    if (state.logs.length > 40) state.logs.pop();
    saveLogs(state.logs);
    renderPanelContent();
  }

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

  let eventSource = null;
  function connectSSE() {
    if (eventSource) eventSource.close();

    eventSource = new EventSource('/global/event');

    eventSource.onopen = function() {
      state.sseConnected = true;
      renderTriggerBtn();
      renderPanelContent();
      pollPendingPermissions();
    };

    eventSource.onmessage = function(e) {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'permission.asked' || data.type === 'permission.v2.asked') {
          if (data.properties) handlePermission(data.properties);
        }
      } catch {}
    };

    eventSource.onerror = function() {
      state.sseConnected = false;
      renderTriggerBtn();
      renderPanelContent();
      setTimeout(connectSSE, 5000);
    };
  }

  // STYLES: Hoàn toàn đồng bộ với OpenCode UI
  const STYLE = document.createElement('style');
  STYLE.textContent = `
    /* Nút kích hoạt trên thanh Titlebar */
    .opencode-autopilot-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 28px;
      padding: 0 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--v2-text-secondary, #a1a1a1);
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      user-select: none;
      transition: all 0.12s ease;
      white-space: nowrap;
      margin-right: 6px;
    }
    .opencode-autopilot-btn:hover {
      color: var(--v2-text-primary, #ffffff);
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.16);
    }
    .opencode-autopilot-btn.active {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    /* Đèn trạng thái chấm tròn */
    .opencode-autopilot-dot {
      width: 6.5px;
      height: 6.5px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
    .opencode-autopilot-dot.smart {
      background: #46c764;
      box-shadow: 0 0 6px rgba(70, 199, 100, 0.5);
    }
    .opencode-autopilot-dot.full {
      background: #4f8bf9;
      box-shadow: 0 0 6px rgba(79, 139, 249, 0.5);
    }
    .opencode-autopilot-dot.off {
      background: #737373;
    }

    /* Badge số lượng */
    .opencode-autopilot-counter {
      font-size: 10.5px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.1);
      color: #e5e5e5;
      line-height: 1.2;
    }

    /* POPOVER CONTAINER */
    .opencode-autopilot-popover {
      position: fixed;
      z-index: 99999;
      width: 320px;
      background: var(--v2-background-bg-layer-02, #181818);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.04);
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #d4d4d4;
      font-size: 12px;
      animation: opencode-popover-in 0.12s ease-out;
    }
    .opencode-autopilot-popover.show {
      display: flex;
    }
    @keyframes opencode-popover-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Popover Header */
    .opencode-popover-header {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .opencode-popover-title {
      font-weight: 600;
      color: #f5f5f5;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .opencode-popover-status {
      font-size: 10.5px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .opencode-popover-status.online {
      color: #46c764;
    }
    .opencode-popover-status.offline {
      color: #a3a3a3;
    }

    /* Segmented Mode Selector */
    .opencode-mode-wrap {
      padding: 10px 12px 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .opencode-segmented {
      display: flex;
      background: rgba(0, 0, 0, 0.35);
      border-radius: 6px;
      padding: 2.5px;
      gap: 2px;
    }
    .opencode-seg-btn {
      flex: 1;
      padding: 5px 0;
      font-size: 11.5px;
      font-weight: 500;
      border-radius: 4px;
      border: none;
      background: transparent;
      color: #a3a3a3;
      cursor: pointer;
      text-align: center;
      transition: all 0.12s ease;
      font-family: inherit;
    }
    .opencode-seg-btn:hover {
      color: #ffffff;
    }
    .opencode-seg-btn.active {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    }
    .opencode-mode-desc {
      font-size: 11px;
      color: #8a8a8a;
      margin-top: 6px;
      line-height: 1.35;
      min-height: 28px;
    }

    /* Stats Bar */
    .opencode-stats-grid {
      display: flex;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.15);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      justify-content: space-between;
      font-size: 11px;
    }
    .opencode-stats-item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #8a8a8a;
    }
    .opencode-stats-val {
      font-weight: 600;
    }
    .opencode-stats-val.green { color: #46c764; }
    .opencode-stats-val.yellow { color: #f59e0b; }

    /* Logs List */
    .opencode-log-list {
      max-height: 160px;
      overflow-y: auto;
      padding: 4px 0;
    }
    .opencode-log-item {
      padding: 6px 12px;
      display: flex;
      flex-direction: column;
      gap: 1.5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.02);
      transition: background 0.1s;
    }
    .opencode-log-item:hover {
      background: rgba(255, 255, 255, 0.03);
    }
    .opencode-log-row-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .opencode-log-cmd {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      color: #e5e5e5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 215px;
    }
    .opencode-log-pill {
      font-size: 9px;
      font-weight: 600;
      padding: 1px 4px;
      border-radius: 3px;
      text-transform: uppercase;
      flex-shrink: 0;
    }
    .opencode-log-pill.approved {
      background: rgba(70, 199, 100, 0.12);
      color: #46c764;
    }
    .opencode-log-pill.held {
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
    }
    .opencode-log-meta {
      font-size: 10px;
      color: #737373;
    }
    .opencode-log-empty {
      padding: 24px;
      text-align: center;
      color: #737373;
      font-size: 11.5px;
    }

    /* Popover Footer */
    .opencode-popover-footer {
      padding: 8px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      background: rgba(0, 0, 0, 0.15);
    }
    .opencode-toggle-lbl {
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      color: #a3a3a3;
      user-select: none;
    }
    .opencode-toggle-lbl input {
      accent-color: #46c764;
      cursor: pointer;
    }
    .opencode-btn-text {
      background: transparent;
      border: none;
      color: #737373;
      cursor: pointer;
      font-size: 11px;
      font-family: inherit;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.12s;
    }
    .opencode-btn-text:hover {
      color: #f87171;
    }

    /* TOAST THÔNG BÁO */
    .opencode-autopilot-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--v2-background-bg-layer-02, #1f1f1f);
      color: #f5f5f5;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-left: 3px solid #46c764;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 11.5px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      z-index: 99999;
      pointer-events: none;
      animation: opencode-toast-up 0.15s ease-out;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .opencode-autopilot-toast.warning {
      border-left-color: #f59e0b;
    }
    @keyframes opencode-toast-up {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(STYLE);

  function showToast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = 'opencode-autopilot-toast ' + type;
    el.innerHTML = `<span>${type === 'success' ? '⚡' : '🛡️'}</span><span>${msg}</span>`;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.25s ease';
      setTimeout(() => el.remove(), 250);
    }, 2500);
  }

  // Icons SVG
  const SHIELD_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

  let triggerBtn = null;
  let popoverEl = null;

  function createPopover() {
    if (popoverEl) return popoverEl;
    popoverEl = document.createElement('div');
    popoverEl.className = 'opencode-autopilot-popover';
    document.body.appendChild(popoverEl);

    document.addEventListener('click', (e) => {
      if (state.panelOpen && triggerBtn && !triggerBtn.contains(e.target) && !popoverEl.contains(e.target)) {
        closePopover();
      }
    });

    window.addEventListener('resize', () => {
      if (state.panelOpen) positionPopover();
    });

    return popoverEl;
  }

  function positionPopover() {
    if (!triggerBtn || !popoverEl) return;
    const rect = triggerBtn.getBoundingClientRect();
    const popoverWidth = 320;
    let right = window.innerWidth - rect.right;
    if (right < 10) right = 10;
    const top = rect.bottom + 6;

    popoverEl.style.top = top + 'px';
    popoverEl.style.right = right + 'px';
  }

  function togglePopover() {
    state.panelOpen = !state.panelOpen;
    if (state.panelOpen) {
      createPopover();
      renderPanelContent();
      positionPopover();
      popoverEl.classList.add('show');
      triggerBtn?.classList.add('active');
    } else {
      closePopover();
    }
  }

  function closePopover() {
    state.panelOpen = false;
    popoverEl?.classList.remove('show');
    triggerBtn?.classList.remove('active');
  }

  function renderTriggerBtn() {
    if (!triggerBtn) return;
    const mode = state.config.mode;
    const count = state.config.autoApproveCount || 0;
    const modeLabel = mode === 'smart' ? 'Smart' : mode === 'full' ? 'Full' : 'Off';

    triggerBtn.innerHTML = `
      ${SHIELD_SVG}
      <span class="opencode-autopilot-dot ${mode}"></span>
      <span>Auto-Pilot: <b>${modeLabel}</b></span>
      ${count > 0 ? `<span class="opencode-autopilot-counter">${count}</span>` : ''}
    `;
    triggerBtn.title = `Auto-Pilot: ${mode.toUpperCase()} (Click to configure)`;
  }

  function getModeDescription(mode) {
    switch (mode) {
      case 'smart':
        return 'Tự động duyệt lệnh an toàn (git status, diff, test, lint, read). Giữ lệnh rủi ro.';
      case 'full':
        return 'Tự động duyệt tất cả các lệnh thông thường. Chỉ chặn lệnh phá hoại (rm, push -f).';
      case 'off':
        return 'Tắt chế độ tự động. Xác nhận từng câu lệnh thủ công như giao diện gốc.';
      default:
        return '';
    }
  }

  function renderPanelContent() {
    if (!popoverEl) return;
    const curMode = state.config.mode;

    popoverEl.innerHTML = `
      <div class="opencode-popover-header">
        <div class="opencode-popover-title">
          ${SHIELD_SVG}
          <span>Auto-Pilot & Security</span>
        </div>
        <div class="opencode-popover-status ${state.sseConnected ? 'online' : 'offline'}">
          ● <span>${state.sseConnected ? 'SSE Live' : 'Connecting'}</span>
        </div>
      </div>

      <div class="opencode-mode-wrap">
        <div class="opencode-segmented">
          <button class="opencode-seg-btn ${curMode === 'smart' ? 'active' : ''}" data-mode="smart">Smart Safe</button>
          <button class="opencode-seg-btn ${curMode === 'full' ? 'active' : ''}" data-mode="full">Full Auto</button>
          <button class="opencode-seg-btn ${curMode === 'off' ? 'active' : ''}" data-mode="off">Manual Off</button>
        </div>
        <div class="opencode-mode-desc">
          ${getModeDescription(curMode)}
        </div>
      </div>

      <div class="opencode-stats-grid">
        <div class="opencode-stats-item">
          <span>Tự duyệt:</span>
          <span class="opencode-stats-val green">${state.config.autoApproveCount}</span>
        </div>
        <div class="opencode-stats-item">
          <span>Chờ duyệt tay:</span>
          <span class="opencode-stats-val yellow">${state.config.blockedCount}</span>
        </div>
      </div>

      <div class="opencode-log-list">
        ${state.logs.length === 0 ? `
          <div class="opencode-log-empty">Chưa có hoạt động nào được ghi lại.</div>
        ` : state.logs.map(log => `
          <div class="opencode-log-item">
            <div class="opencode-log-row-top">
              <span class="opencode-log-cmd" title="${log.cmd}">${log.cmd}</span>
              <span class="opencode-log-pill ${log.action}">${log.action === 'approved' ? 'Approved' : 'Held'}</span>
            </div>
            <div class="opencode-log-meta">
              ${log.time} • ${log.reason}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="opencode-popover-footer">
        <label class="opencode-toggle-lbl">
          <input type="checkbox" id="opencode-autopilot-toast-toggle" ${state.config.notify ? 'checked' : ''} />
          <span>Thông báo Toast</span>
        </label>
        <button class="opencode-btn-text" id="opencode-autopilot-clear">Xóa lịch sử</button>
      </div>
    `;

    popoverEl.querySelectorAll('.opencode-seg-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const m = btn.getAttribute('data-mode');
        state.config.mode = m;
        saveConfig(state.config);
        renderTriggerBtn();
        renderPanelContent();
        showToast('Chuyển sang chế độ: ' + m.toUpperCase(), 'success');
      });
    });

    const chk = popoverEl.querySelector('#opencode-autopilot-toast-toggle');
    if (chk) {
      chk.addEventListener('change', (e) => {
        state.config.notify = e.target.checked;
        saveConfig(state.config);
      });
    }

    const clearBtn = popoverEl.querySelector('#opencode-autopilot-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.logs = [];
        state.config.autoApproveCount = 0;
        state.config.blockedCount = 0;
        saveConfig(state.config);
        saveLogs(state.logs);
        renderTriggerBtn();
        renderPanelContent();
      });
    }
  }

  // Gắn nút Auto-Pilot trực tiếp vào OpenCode Titlebar Right Container
  function attachButtonToTitlebar() {
    // Xóa HUD cũ nếu có
    const oldHud = document.getElementById('opencode-autopilot-root');
    if (oldHud) oldHud.remove();

    // Tìm container action bên phải của header: #opencode-titlebar-right .flex.items-center.gap-2
    const targetGroup = document.querySelector('#opencode-titlebar-right .flex.items-center.gap-2') 
      || document.querySelector('#opencode-titlebar-right')
      || document.querySelector('header .relative.z-20');

    if (!targetGroup) return false;

    // Nếu nút đã tồn tại trong targetGroup, không tạo lại
    if (targetGroup.querySelector('#opencode-autopilot-trigger')) return true;

    if (!triggerBtn) {
      triggerBtn = document.createElement('button');
      triggerBtn.id = 'opencode-autopilot-trigger';
      triggerBtn.type = 'button';
      triggerBtn.className = 'opencode-autopilot-btn';
      triggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopover();
      });
    }

    // Chèn trước nút Toggle review nếu có, hoặc prepend vào targetGroup
    const toggleReview = targetGroup.querySelector('[aria-label="Toggle review"]')?.parentElement;
    if (toggleReview) {
      targetGroup.insertBefore(triggerBtn, toggleReview);
    } else {
      targetGroup.prepend(triggerBtn);
    }

    renderTriggerBtn();
    return true;
  }

  // Observer theo dõi DOM để bảo toàn vị trí khi OpenCode re-render
  let observer = null;
  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(() => {
      const exists = document.getElementById('opencode-autopilot-trigger');
      if (!exists) {
        attachButtonToTitlebar();
      }
    });

    const header = document.querySelector('header') || document.body;
    observer.observe(header, { childList: true, subtree: true });
  }

  function init() {
    attachButtonToTitlebar();
    startObserver();
    connectSSE();
    setInterval(pollPendingPermissions, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[OpenCode WebUI] Smart Auto-Pilot & Security Guard v2.0 (Native Integration) loaded');
})();
