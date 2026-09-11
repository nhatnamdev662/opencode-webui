// OpenCode WebUI Gaslight Feature v3
// - Repositioned:
//   * Chat messages: Edit button located in the action bar directly BELOW the assistant message
//   * Thinking blocks: Edit button located directly BELOW the thinking/reasoning block
// - Reliable selector: Uses data-component="text-part" & data-component="reasoning-part" with data-timeline-part-id
// - Fixed caching: Never serves stale code
// - Fixed 400 error: PATCH body includes sessionID + messageID + full part object
// - Safe editor: Closes ONLY via Cancel or Escape (drag/selection safe)

(function() {
  'use strict';

  window.__OPENCODE_SESSIONS__ = window.__OPENCODE_SESSIONS__ || {};
  window.__OPENCODE_ACTIVE_DIR__ = window.__OPENCODE_ACTIVE_DIR__ || null;

  // Lấy active directory từ OpenCode Core
  fetch('/path').then(r => r.json()).then(d => {
    if (d && (d.directory || d.worktree)) {
      window.__OPENCODE_ACTIVE_DIR__ = d.directory || d.worktree;
    }
  }).catch(() => {});

  // Ensure showReasoningSummaries is enabled in localStorage so thinking blocks render
  try {
    const raw = localStorage.getItem('settings.v3');
    if (raw) {
      const s = JSON.parse(raw);
      if (s.general && s.general.showReasoningSummaries === false) {
        s.general.showReasoningSummaries = true;
        localStorage.setItem('settings.v3', JSON.stringify(s));
      }
    }
  } catch {}

  const STYLE = document.createElement('style');
  STYLE.textContent = `
    .gaslight-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 22px;
      padding: 0 8px;
      font-size: 11px;
      font-family: inherit;
      font-weight: 500;
      color: var(--text-weak, #8b949e);
      background: transparent;
      border: 1px solid rgba(139,148,158,0.22);
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
      line-height: 1;
      opacity: 0.75;
    }
    .gaslight-btn:hover {
      color: var(--text-normal, #f0f6fc);
      background: rgba(139,148,158,0.14);
      border-color: rgba(139,148,158,0.45);
      opacity: 1;
    }
    .gaslight-btn svg {
      width: 12px;
      height: 12px;
      pointer-events: none;
      flex-shrink: 0;
    }
    .gaslight-btn-chat {
      margin-left: 2px;
    }
    .gaslight-btn-fork {
      margin-left: 4px;
    }

    /* CONTEXT BADGE & HUD */
    .opencode-context-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 24px;
      padding: 0 7px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text-weak, #a1a1a1);
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      user-select: none;
      transition: all 0.12s ease;
      white-space: nowrap;
    }
    .opencode-context-badge:hover {
      color: var(--text-normal, #f5f5f5);
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.16);
    }
    .opencode-context-badge.active {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
    .context-badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #46c764;
      flex-shrink: 0;
    }
    .context-badge-dot.warning { background: #f59e0b; }
    .context-badge-dot.danger { background: #f87171; }
    .context-badge-pct {
      font-size: 10px;
      font-weight: 600;
      padding: 1px 4px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.08);
      color: #e5e5e5;
    }
    .opencode-context-badge-prompt {
      margin-right: 6px;
      height: 26px;
      background: rgba(255, 255, 255, 0.05);
    }
    .opencode-btn-compact {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 500;
      font-family: inherit;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      cursor: pointer;
      transition: all 0.15s ease;
      width: 100%;
      margin-top: 4px;
    }
    .opencode-btn-compact:hover {
      background: rgba(56, 189, 248, 0.2);
      border-color: rgba(56, 189, 248, 0.5);
      color: #7dd3fc;
    }
    .opencode-btn-compact:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .opencode-panel-compact-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      font-family: inherit;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.22);
      cursor: pointer;
      transition: all 0.15s ease;
      margin-right: 8px;
    }
    .opencode-panel-compact-btn:hover {
      background: rgba(56, 189, 248, 0.18);
      border-color: rgba(56, 189, 248, 0.45);
      color: #7dd3fc;
    }
    .opencode-header-compact-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--v2-icon-icon-muted, #808080);
      cursor: pointer;
      user-select: none;
      transition: all 0.12s ease;
      flex-shrink: 0;
    }
    .opencode-header-compact-btn:hover {
      color: var(--v2-icon-icon-base, #ffffff);
      background: rgba(255, 255, 255, 0.08);
    }
    .opencode-header-compact-btn:active {
      background: rgba(255, 255, 255, 0.14);
    }
    .opencode-header-compact-btn.loading svg {
      animation: opencode-spin 1s linear infinite;
      color: #38bdf8;
    }
    @keyframes opencode-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Popover Context HUD */
    .opencode-context-popover {
      position: fixed;
      z-index: 99999;
      width: 310px;
      background: var(--v2-background-bg-layer-02, #181818);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04);
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #d4d4d4;
      font-size: 11.5px;
      animation: opencode-popover-in 0.12s ease-out;
    }
    .opencode-context-popover.show {
      display: flex;
    }
    .context-pop-header {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .context-pop-title {
      font-weight: 600;
      color: #f5f5f5;
      font-size: 12px;
    }
    .context-pop-model {
      font-size: 10px;
      color: #8a8a8a;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
    .context-pop-body {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .context-progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .context-progress-bar {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.08);
      display: flex;
      overflow: hidden;
    }
    .context-progress-segment {
      height: 100%;
      transition: width 0.3s ease;
    }
    .context-progress-segment.input { background: #7698fd; }
    .context-progress-segment.output { background: #46c764; }
    .context-progress-segment.reasoning { background: #a855f7; }
    .context-progress-legend {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 10px;
      color: #8a8a8a;
      margin-top: 2px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .legend-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .context-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .context-metric {
      display: flex;
      flex-direction: column;
      gap: 1px;
      background: rgba(0, 0, 0, 0.2);
      padding: 6px 8px;
      border-radius: 5px;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
    .context-metric-label {
      font-size: 10px;
      color: #8a8a8a;
    }
    .context-metric-val {
      font-size: 12px;
      font-weight: 600;
      color: #f0f6fc;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
    .gaslight-reasoning-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
      margin-bottom: 8px;
      padding-top: 2px;
    }
    .gaslight-text-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
      margin-bottom: 6px;
    }

    .gaslight-editor-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: gaslight-fade-in 0.15s ease;
    }
    @keyframes gaslight-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .gaslight-editor-box {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      width: 90%;
      max-width: 760px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 48px rgba(0,0,0,0.5);
      overflow: hidden;
    }
    .gaslight-editor-header {
      padding: 12px 16px;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #0d1117;
      cursor: default;
    }
    .gaslight-editor-title {
      font-size: 13px;
      font-weight: 600;
      color: #f0f6fc;
      font-family: monospace;
    }
    .gaslight-editor-subtitle {
      font-size: 10px;
      color: #6e7681;
      font-family: monospace;
    }
    .gaslight-editor-textarea {
      flex: 1;
      width: 100%;
      padding: 16px;
      background: #0d1117;
      color: #e6edf3;
      border: none;
      outline: none;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 12.5px;
      line-height: 1.6;
      resize: none;
      min-height: 250px;
      max-height: 65vh;
      cursor: text;
    }
    .gaslight-editor-textarea:focus {
      outline: none;
      box-shadow: none;
    }
    .gaslight-editor-footer {
      padding: 10px 16px;
      border-top: 1px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #0d1117;
    }
    .gaslight-editor-footer-hint {
      font-size: 11px;
      color: #6e7681;
      font-family: monospace;
    }
    .gaslight-editor-actions {
      display: flex;
      gap: 8px;
    }
    .gaslight-btn-cancel {
      padding: 6px 14px;
      font-size: 12px;
      font-family: monospace;
      color: #8b949e;
      background: transparent;
      border: 1px solid #30363d;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .gaslight-btn-cancel:hover {
      color: #f0f6fc;
      border-color: #8b949e;
    }
    .gaslight-btn-save {
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      font-family: monospace;
      color: #ffffff;
      background: #238636;
      border: 1px solid #2ea043;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .gaslight-btn-save:hover {
      background: #2ea043;
    }
    .gaslight-btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .gaslight-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 12px;
      font-family: monospace;
      font-weight: 500;
      z-index: 999999;
      animation: gaslight-toast-in 0.2s ease;
      pointer-events: none;
    }
    .gaslight-toast.success {
      background: #238636;
      color: #ffffff;
      border: 1px solid #2ea043;
    }
    .gaslight-toast.error {
      background: #da3633;
      color: #ffffff;
      border: 1px solid #f85149;
    }
    @keyframes gaslight-toast-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(STYLE);

  const PENCIL_SVG = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L3.462 11.1a.25.25 0 00-.064.108l-.631 2.208 2.208-.63a.25.25 0 00.108-.064l8.61-8.61a.25.25 0 000-.354l-1.086-1.086z"/></svg>';
  const FORK_SVG = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="4" cy="4" r="2"></circle><circle cx="4" cy="12" r="2"></circle><circle cx="12" cy="5" r="2"></circle><path d="M4 6v4"></path><path d="M4 7c0 2 2 3 4 3h2"></path></svg>';

  function showToast(message, type) {
    const t = document.createElement('div');
    t.className = 'gaslight-toast ' + type;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  function openEditor(sessionID, messageID, partID, originalText, partType, fullPart) {
    document.querySelectorAll('.gaslight-editor-overlay').forEach(o => o.remove());

    const overlay = document.createElement('div');
    overlay.className = 'gaslight-editor-overlay';

    const label = partType === 'reasoning' ? 'Thinking / Reasoning' : 'Response Text';

    overlay.innerHTML = `
      <div class="gaslight-editor-box">
        <div class="gaslight-editor-header">
          <div>
            <div class="gaslight-editor-title">Edit ${label}</div>
            <div class="gaslight-editor-subtitle">Part: ${partID} | Message: ${messageID}</div>
          </div>
        </div>
        <textarea class="gaslight-editor-textarea" spellcheck="false"></textarea>
        <div class="gaslight-editor-footer">
          <div class="gaslight-editor-footer-hint">Esc to cancel — click outside does nothing</div>
          <div class="gaslight-editor-actions">
            <button class="gaslight-btn-cancel">Cancel</button>
            <button class="gaslight-btn-save">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const textarea = overlay.querySelector('.gaslight-editor-textarea');
    const btnCancel = overlay.querySelector('.gaslight-btn-cancel');
    const btnSave = overlay.querySelector('.gaslight-btn-save');

    textarea.value = originalText;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    const close = () => {
      document.removeEventListener('keydown', escHandler, true);
      overlay.remove();
    };

    btnCancel.addEventListener('click', close);

    function escHandler(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    }
    document.addEventListener('keydown', escHandler, true);

    btnSave.addEventListener('click', async () => {
      const newText = textarea.value;
      if (newText === originalText) {
        showToast('No changes made', 'success');
        close();
        return;
      }

      btnSave.disabled = true;
      btnSave.textContent = 'Saving...';

      try {
        const payload = Object.assign({}, fullPart, {
          sessionID: sessionID,
          messageID: messageID,
          id: partID,
          type: partType,
          text: newText
        });
        if (partType === 'reasoning' && !payload.time) {
          payload.time = { start: Date.now(), end: Date.now() };
        }

        const url = '/session/' + sessionID + '/message/' + messageID + '/part/' + partID;
        const resp = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (resp.ok) {
          if (fullPart) fullPart.text = newText;
          const cached = partCache.get(partID);
          if (cached && cached.part) cached.part.text = newText;

          showToast('Updated successfully!', 'success');
          close();
        } else {
          const errText = await resp.text();
          showToast('Failed: ' + resp.status + ' ' + errText.slice(0, 80), 'error');
          btnSave.disabled = false;
          btnSave.textContent = 'Save Changes';
        }
      } catch (err) {
        showToast('Network error: ' + err.message, 'error');
        btnSave.disabled = false;
        btnSave.textContent = 'Save Changes';
      }
    });
  }

  // Cache: messageID -> message, and partID -> { part, message, sessionID }
  const messageCache = new Map();
  const partCache = new Map();

  function cacheMessages(msgs, fallbackSessionID) {
    if (!Array.isArray(msgs)) return;
    msgs.forEach(msg => {
      if (msg?.info?.id) {
        messageCache.set(msg.info.id, msg);
        const sid = msg.info.sessionID || fallbackSessionID;
        (msg.parts || []).forEach(p => {
          if (p?.id) {
            partCache.set(p.id, {
              part: p,
              message: msg,
              sessionID: p.sessionID || sid
            });
          }
        });
      }
    });
  }

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

    // Cache session directory
    if (url.match(/\/session\/ses_[^/]+$/)) {
      try {
        const cloned = response.clone();
        const sData = await cloned.json();
        if (sData?.id && sData?.directory) {
          window.__OPENCODE_SESSIONS__[sData.id] = sData;
          window.__OPENCODE_ACTIVE_DIR__ = sData.directory;
        }
      } catch {}
    }

    if (url.match(/\/session\/ses_[^/]+\/message/) && !url.includes('/part/')) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        const match = url.match(/ses_[a-zA-Z0-9]+/);
        const sid = match ? match[0] : null;
        cacheMessages(data, sid);
        setTimeout(() => injectEditButtons(), 200);
      } catch {}
    }

    return response;
  };

  // Cơ chế mở khóa và xử lý Auto-Accept Permissions trực tiếp
  function isAutoAcceptActive() {
    try {
      if (localStorage.getItem('opencode_auto_accept_forced') === 'true') return true;
      const raw = localStorage.getItem('opencode.global.dat:permission');
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.autoAccept) {
          const vals = Object.values(p.autoAccept);
          if (vals.some(v => v === true)) return true;
        }
      }
    } catch {}
    return false;
  }

  const handledPermissions = new Set();
  async function checkAndAutoApprove(req) {
    if (!isAutoAcceptActive()) return;
    const id = req?.id;
    if (!id || handledPermissions.has(id)) return;
    handledPermissions.add(id);

    try {
      await originalFetch('/permission/' + encodeURIComponent(id) + '/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: 'once' })
      });
      console.log('[OpenCode WebUI] Auto-approved permission:', id);
    } catch (e) {}
  }

  async function pollPendingPermissions() {
    if (!isAutoAcceptActive()) return;
    try {
      const res = await originalFetch('/permission');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          for (const p of list) checkAndAutoApprove(p);
        }
      }
    } catch {}
  }

  let globalEventSource = null;
  function initAutoAcceptSSE() {
    if (globalEventSource) return;
    try {
      globalEventSource = new EventSource('/global/event');
      globalEventSource.onmessage = function(e) {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'permission.asked' || data.type === 'permission.v2.asked') {
            if (data.properties) checkAndAutoApprove(data.properties);
          }
        } catch {}
      };
      globalEventSource.onerror = function() {
        globalEventSource = null;
        setTimeout(initAutoAcceptSSE, 6000);
      };
    } catch {}
  }

  // Mở khóa switch trong dialog Settings và xử lý click trực tiếp
  function unblockAutoAcceptSwitch() {
    const actionDiv = document.querySelector('[data-action="settings-auto-accept-permissions"]');
    if (!actionDiv) return;

    const sw = actionDiv.querySelector('[data-component="switch"]') || actionDiv;
    const input = actionDiv.querySelector('input');
    const control = actionDiv.querySelector('[data-slot="switch-control"]');
    const thumb = actionDiv.querySelector('[data-slot="switch-thumb"]');

    if (input && input.disabled) {
      input.disabled = false;
      input.removeAttribute('disabled');
      input.setAttribute('aria-disabled', 'false');
    }
    if (sw) {
      sw.removeAttribute('data-disabled');
      sw.style.pointerEvents = 'auto';
      sw.style.cursor = 'pointer';
      sw.style.opacity = '1';
    }

    function syncVisual(isActive) {
      if (input) {
        input.checked = isActive;
        input.setAttribute('aria-checked', isActive ? 'true' : 'false');
      }
      if (isActive) {
        sw?.setAttribute('data-checked', '');
        control?.setAttribute('data-checked', '');
        thumb?.setAttribute('data-checked', '');
      } else {
        sw?.removeAttribute('data-checked');
        control?.removeAttribute('data-checked');
        thumb?.removeAttribute('data-checked');
      }
    }

    // Luôn hiển thị đúng trạng thái hiện tại
    syncVisual(isAutoAcceptActive());

    if (!actionDiv.dataset.unblocked) {
      actionDiv.dataset.unblocked = 'true';

      const onToggle = function(e) {
        e.preventDefault();
        e.stopPropagation();

        const next = !isAutoAcceptActive();

        // 1. Ghi vào localStorage chuẩn của OpenCode Core
        try {
          const raw = localStorage.getItem('opencode.global.dat:permission');
          const p = raw ? JSON.parse(raw) : {};
          p.autoAccept = p.autoAccept || {};

          const sid = getCurrentSessionID();
          const dir = window.__OPENCODE_ACTIVE_DIR__ || 'E:\\crack';
          let dirB64 = '';
          try { dirB64 = btoa(dir).replace(/=+$/, ''); } catch {}

          if (dirB64) {
            p.autoAccept[dirB64] = next;
            if (sid) p.autoAccept[dirB64 + '/' + sid] = next;
          }
          if (sid) p.autoAccept[sid] = next;

          localStorage.setItem('opencode.global.dat:permission', JSON.stringify(p));
        } catch {}

        // 2. Lưu cờ dự phòng
        localStorage.setItem('opencode_auto_accept_forced', next ? 'true' : 'false');

        // 3. Đồng bộ giao diện Switch ngay lập tức
        syncVisual(next);

        // 4. Nếu bật, duyệt ngay mọi permission đang pending
        if (next) {
          pollPendingPermissions();
          showToast('Tự động chấp nhận quyền: ĐÃ BẬT', 'success');
        } else {
          showToast('Tự động chấp nhận quyền: ĐÃ TẮT', 'info');
        }
      };

      actionDiv.addEventListener('click', onToggle, true);
      sw?.addEventListener('click', onToggle, true);
    }
  }

  function getCurrentSessionID() {
    const urlMatch = window.location.href.match(/ses_[a-zA-Z0-9]+/);
    if (urlMatch) return urlMatch[0];
    for (const [, entry] of partCache) {
      if (entry.sessionID) return entry.sessionID;
    }
    return null;
  }

  async function ensurePartLoaded(sessionID, partId) {
    let cached = partCache.get(partId);
    if (cached && cached.part && cached.message) return cached;

    if (sessionID) {
      try {
        const resp = await originalFetch('/session/' + sessionID + '/message');
        const msgs = await resp.json();
        cacheMessages(msgs, sessionID);
      } catch {}
    }
    return partCache.get(partId) || null;
  }

  async function handleEditClick(sessionID, partId, partType, btn) {
    btn.disabled = true;
    const oldHtml = btn.innerHTML;
    btn.innerHTML = PENCIL_SVG + '<span>Loading...</span>';

    try {
      const cached = await ensurePartLoaded(sessionID, partId);
      if (cached && cached.part) {
        const fullPart = cached.part;
        const msgId = cached.message.info.id;
        openEditor(sessionID, msgId, partId, fullPart.text || '', fullPart.type, fullPart);
        return;
      }

      // Fallback if not found in cache: try to read from DOM
      const domEl = document.querySelector('[data-timeline-part-id="' + partId + '"]');
      const text = domEl ? domEl.innerText.trim() : '';
      openEditor(sessionID, 'unknown', partId, text, partType, {
        id: partId,
        sessionID: sessionID,
        type: partType,
        text: text
      });
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldHtml;
    }
  }

  async function handleForkClick(sessionID, targetMessageID, btn) {
    if (!sessionID || !targetMessageID) {
      showToast('Không tìm thấy ID tin nhắn để fork', 'error');
      return;
    }

    btn.disabled = true;
    const oldHtml = btn.innerHTML;
    btn.innerHTML = FORK_SVG + '<span>Forking...</span>';

    try {
      // Lấy danh sách tin nhắn để xác định đúng điểm cắt (inclusive)
      let messages = [];
      try {
        const mResp = await originalFetch('/session/' + encodeURIComponent(sessionID) + '/message');
        if (mResp.ok) messages = await mResp.json();
      } catch {}

      let forkPayload = {};
      const targetIdx = messages.findIndex(m => m?.info?.id === targetMessageID);

      if (targetIdx !== -1) {
        if (targetIdx < messages.length - 1) {
          // OpenCode Core cắt TRƯỚC messageID được chỉ định,
          // nên truyền message kế tiếp để giữ trọn vẹn đến hết tin nhắn đã bấm
          const nextMsg = messages[targetIdx + 1];
          if (nextMsg?.info?.id) {
            forkPayload = { messageID: nextMsg.info.id };
          }
        } else {
          // Nếu bấm ở tin nhắn cuối cùng, không truyền messageID để clone toàn bộ
          forkPayload = {};
        }
      } else {
        forkPayload = { messageID: targetMessageID };
      }

      const resp = await originalFetch('/session/' + encodeURIComponent(sessionID) + '/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forkPayload)
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || 'Lỗi server: ' + resp.status);
      }

      const newSession = await resp.json();
      showToast('Phân nhánh thành công: ' + (newSession.title || newSession.id), 'success');

      // Chuyển hướng tức thì 0ms qua SPA router (không reload trang gây chậm)
      const currentPath = window.location.pathname;
      let newPath = '';
      if (currentPath.includes('/session/')) {
        newPath = currentPath.replace(/\/session\/[^\/]+/, '/session/' + newSession.id);
      } else {
        newPath = '/session/' + newSession.id;
      }

      // Kích hoạt SPA navigation bằng thẻ <a> nội bộ
      const spaLink = document.createElement('a');
      spaLink.href = newPath;
      spaLink.style.display = 'none';
      document.body.appendChild(spaLink);
      spaLink.click();
      spaLink.remove();

      // Fallback an toàn nếu sau 500ms URL chưa đổi
      setTimeout(() => {
        if (!window.location.pathname.includes(newSession.id)) {
          window.location.href = newPath;
        }
      }, 500);
    } catch (err) {
      showToast('Lỗi khi phân nhánh: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = oldHtml;
    }
  }

  function injectEditButtons() {
    const sessionID = getCurrentSessionID();
    if (!sessionID) return;

    // 0. User messages -> thêm nút Fork to new session
    const userWrappers = document.querySelectorAll('[data-slot="user-message-copy-wrapper"]');
    userWrappers.forEach(wrapper => {
      const msgEl = wrapper.closest('[data-message-id]');
      const messageID = msgEl?.getAttribute('data-message-id') || msgEl?.id?.replace(/^message-/, '');
      if (!messageID || wrapper.querySelector('[data-gaslight-fork]')) return;

      const forkBtn = document.createElement('button');
      forkBtn.className = 'gaslight-btn gaslight-btn-fork';
      forkBtn.setAttribute('data-gaslight-fork', messageID);
      forkBtn.setAttribute('type', 'button');
      forkBtn.title = 'Fork session from this message';
      forkBtn.innerHTML = FORK_SVG + '<span>Fork</span>';

      forkBtn.addEventListener('mousedown', e => e.stopPropagation());
      forkBtn.addEventListener('mouseup', e => e.stopPropagation());
      forkBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        handleForkClick(sessionID, messageID, forkBtn);
      });

      wrapper.appendChild(forkBtn);
    });

    // 1. Assistant text parts (chat messages) -> đặt ở DƯỚI đoạn chat của agent
    const textEls = document.querySelectorAll('[data-component="text-part"][data-timeline-part-id]');
    textEls.forEach(el => {
      const partId = el.getAttribute('data-timeline-part-id');
      const msgEl = el.closest('[data-message-id]');
      const messageID = partCache.get(partId)?.message?.info?.id || partCache.get(partId)?.part?.messageID || msgEl?.getAttribute('data-message-id');

      if (partId && !el.querySelector('[data-gaslight-part="' + partId + '"]')) {
        const btn = document.createElement('button');
        btn.className = 'gaslight-btn gaslight-btn-chat';
        btn.setAttribute('data-gaslight-part', partId);
        btn.setAttribute('type', 'button');
        btn.title = 'Edit assistant response';
        btn.innerHTML = PENCIL_SVG + '<span>Edit</span>';

        btn.addEventListener('mousedown', e => e.stopPropagation());
        btn.addEventListener('mouseup', e => e.stopPropagation());
        btn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          handleEditClick(sessionID, partId, 'text', btn);
        });

        const copyWrapper = el.querySelector('[data-slot="text-part-copy-wrapper"]');
        if (copyWrapper) {
          const copyTrigger = copyWrapper.querySelector('[data-component="tooltip-v2-trigger"]');
          if (copyTrigger) {
            copyTrigger.after(btn);
          } else {
            copyWrapper.appendChild(btn);
          }

          // Thêm nút Fork cho Assistant message
          if (messageID && !copyWrapper.querySelector('[data-gaslight-fork]')) {
            const forkBtn = document.createElement('button');
            forkBtn.className = 'gaslight-btn gaslight-btn-fork';
            forkBtn.setAttribute('data-gaslight-fork', messageID);
            forkBtn.setAttribute('type', 'button');
            forkBtn.title = 'Fork session from this response';
            forkBtn.innerHTML = FORK_SVG + '<span>Fork</span>';

            forkBtn.addEventListener('mousedown', e => e.stopPropagation());
            forkBtn.addEventListener('mouseup', e => e.stopPropagation());
            forkBtn.addEventListener('click', e => {
              e.preventDefault();
              e.stopPropagation();
              handleForkClick(sessionID, messageID, forkBtn);
            });

            btn.after(forkBtn);
          }
        } else {
          const body = el.querySelector('[data-slot="text-part-body"]') || el;
          const footer = document.createElement('div');
          footer.className = 'gaslight-text-footer';
          footer.appendChild(btn);

          if (messageID) {
            const forkBtn = document.createElement('button');
            forkBtn.className = 'gaslight-btn gaslight-btn-fork';
            forkBtn.setAttribute('data-gaslight-fork', messageID);
            forkBtn.setAttribute('type', 'button');
            forkBtn.title = 'Fork session from this response';
            forkBtn.innerHTML = FORK_SVG + '<span>Fork</span>';
            forkBtn.addEventListener('mousedown', e => e.stopPropagation());
            forkBtn.addEventListener('mouseup', e => e.stopPropagation());
            forkBtn.addEventListener('click', e => {
              e.preventDefault();
              e.stopPropagation();
              handleForkClick(sessionID, messageID, forkBtn);
            });
            footer.appendChild(forkBtn);
          }

          body.after(footer);
        }
      }
    });

    // 2. Assistant thinking parts (reasoning) -> đặt ở DƯỚI đoạn thinking
    const reasoningEls = document.querySelectorAll('[data-component="reasoning-part"][data-timeline-part-id]');
    reasoningEls.forEach(el => {
      const partId = el.getAttribute('data-timeline-part-id');
      if (!partId || el.querySelector('[data-gaslight-part="' + partId + '"]')) return;

      const footer = document.createElement('div');
      footer.className = 'gaslight-reasoning-footer';

      const btn = document.createElement('button');
      btn.className = 'gaslight-btn gaslight-btn-thinking';
      btn.setAttribute('data-gaslight-part', partId);
      btn.setAttribute('type', 'button');
      btn.title = 'Edit thinking / reasoning';
      btn.innerHTML = PENCIL_SVG + '<span>Edit thinking</span>';

      btn.addEventListener('mousedown', e => e.stopPropagation());
      btn.addEventListener('mouseup', e => e.stopPropagation());
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        handleEditClick(sessionID, partId, 'reasoning', btn);
      });

      footer.appendChild(btn);
      el.appendChild(footer);
    });
  }

  // Context Health & Token HUD
  let contextPopoverEl = null;
  let isContextPopoverOpen = false;

  function formatTokens(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  }

  function getContextPopover() {
    if (contextPopoverEl) return contextPopoverEl;
    contextPopoverEl = document.createElement('div');
    contextPopoverEl.className = 'opencode-context-popover';
    document.body.appendChild(contextPopoverEl);

    document.addEventListener('click', (e) => {
      if (isContextPopoverOpen && !contextPopoverEl.contains(e.target) && !document.getElementById('opencode-context-badge')?.contains(e.target)) {
        closeContextPopover();
      }
    });

    window.addEventListener('resize', () => {
      if (isContextPopoverOpen) positionContextPopover();
    });

    return contextPopoverEl;
  }

  function positionContextPopover() {
    const trigger = document.getElementById('opencode-context-badge');
    if (!trigger || !contextPopoverEl) return;
    const rect = trigger.getBoundingClientRect();
    const popWidth = 310;
    let left = rect.left;
    if (left + popWidth > window.innerWidth - 10) {
      left = window.innerWidth - popWidth - 10;
    }
    const top = rect.bottom + 6;
    contextPopoverEl.style.top = top + 'px';
    contextPopoverEl.style.left = left + 'px';
  }

  function toggleContextPopover(session, onlineData) {
    isContextPopoverOpen = !isContextPopoverOpen;
    if (isContextPopoverOpen) {
      const pop = getContextPopover();
      renderContextPopoverContent(session, onlineData);
      positionContextPopover();
      pop.classList.add('show');
      document.getElementById('opencode-context-badge')?.classList.add('active');
    } else {
      closeContextPopover();
    }
  }

  function closeContextPopover() {
    isContextPopoverOpen = false;
    contextPopoverEl?.classList.remove('show');
    document.getElementById('opencode-context-badge')?.classList.remove('active');
  }

  let providersCache = null;
  async function fetchOnlineProviders() {
    if (providersCache) return providersCache;
    try {
      const res = await originalFetch('/config/providers');
      if (res.ok) {
        const data = await res.json();
        providersCache = data.providers || [];
      }
    } catch {}
    return providersCache || [];
  }

  // Lấy dữ liệu ngữ cảnh online chuẩn xác 100% từ provider, tuyệt đối không hardcode
  function getOnlineModelLimit(providers, providerID, modelID) {
    if (!providers || !providerID || !modelID) return null;
    const prov = providers.find(p => p.id === providerID);
    const mod = prov?.models?.[modelID];
    if (mod?.limit?.context && mod.limit.context > 0) {
      return {
        limit: mod.limit.context,
        modelName: mod.name || modelID
      };
    }
    return null; // Không có dữ liệu online chính xác -> trả về null để ẩn
  }

  async function compactSession(session, btn) {
    if (!session?.id || !session?.model?.providerID || !session?.model?.id) {
      showToast('Không có thông tin model để nén', 'error');
      return;
    }

    btn.disabled = true;
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '<span>⏳ Đang nén ngữ cảnh...</span>';

    try {
      const resp = await originalFetch('/session/' + encodeURIComponent(session.id) + '/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerID: session.model.providerID,
          modelID: session.model.id
        })
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || 'Lỗi server: ' + resp.status);
      }

      showToast('✓ Đã nén ngữ cảnh thành công!', 'success');
      closeContextPopover();

      // Cập nhật lại session
      const updated = await originalFetch('/session/' + encodeURIComponent(session.id)).then(r => r.json());
      window.__OPENCODE_SESSIONS__[session.id] = updated;
      renderContextHUD();
    } catch (e) {
      showToast('Lỗi khi nén: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldHtml;
    }
  }

  function getActiveContextTokens(session) {
    let lastTokens = null;
    for (const [, entry] of partCache) {
      const m = entry.message;
      if (m?.info?.role === 'assistant' && m?.info?.tokens?.total) {
        lastTokens = m.info.tokens;
      }
    }

    if (lastTokens) {
      const input = lastTokens.input || 0;
      const cacheRead = lastTokens.cache?.read || 0;
      const output = lastTokens.output || 0;
      const reasoning = lastTokens.reasoning || 0;
      const total = input + cacheRead + output;
      return { input, cacheRead, output, reasoning, total, isTurn: true };
    }

    const t = session?.tokens || {};
    const input = t.input || 0;
    const cacheRead = t.cache?.read || 0;
    const output = t.output || 0;
    const reasoning = t.reasoning || 0;
    const total = input + output;
    return { input, cacheRead, output, reasoning, total, isTurn: false };
  }

  function renderContextPopoverContent(session, onlineData) {
    if (!contextPopoverEl || !onlineData) return;
    const modelName = onlineData.modelName;
    const limit = onlineData.limit;
    const active = getActiveContextTokens(session);

    const total = active.total || 0;
    const pct = Math.min(100, Math.max(1, Math.round((total / limit) * 100)));

    const inputPct = Math.min(100, (active.input / limit) * 100);
    const outputPct = Math.min(100, (active.output / limit) * 100);
    const cachePct = Math.min(100, (active.cacheRead / limit) * 100);

    const cumTokens = session?.tokens || {};

    contextPopoverEl.innerHTML = `
      <div class="context-pop-header">
        <span class="context-pop-title">Context & Token Health</span>
        <span class="context-pop-model">${modelName}</span>
      </div>
      <div class="context-pop-body">
        <div class="context-progress-wrap">
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
            <span>Ngữ cảnh: <b style="color:#f0f6fc">${formatTokens(total)}</b> / ${formatTokens(limit)}</span>
            <span style="font-weight:600; color:${pct > 85 ? '#f87171' : pct > 60 ? '#f59e0b' : '#46c764'}">${pct}%</span>
          </div>
          <div class="context-progress-bar">
            <div class="context-progress-segment input" style="width:${Math.max(2, inputPct)}%;" title="Input Prompt: ${active.input.toLocaleString()}"></div>
            <div class="context-progress-segment reasoning" style="width:${cachePct}%; background:#38bdf8;" title="Cache Read: ${active.cacheRead.toLocaleString()}"></div>
            <div class="context-progress-segment output" style="width:${Math.max(1, outputPct)}%;" title="Output: ${active.output.toLocaleString()}"></div>
          </div>
          <div class="context-progress-legend">
            <span class="legend-item"><span class="legend-dot" style="background:#7698fd"></span>Prompt (${formatTokens(active.input)})</span>
            <span class="legend-item"><span class="legend-dot" style="background:#38bdf8"></span>Cache (${formatTokens(active.cacheRead)})</span>
            <span class="legend-item"><span class="legend-dot" style="background:#46c764"></span>Output (${formatTokens(active.output)})</span>
          </div>
        </div>

        <div class="context-grid">
          <div class="context-metric">
            <span class="context-metric-label">Prompt Tokens</span>
            <span class="context-metric-val">${active.input.toLocaleString()}</span>
          </div>
          <div class="context-metric">
            <span class="context-metric-label">Cache Read</span>
            <span class="context-metric-val" style="color:#38bdf8">${active.cacheRead.toLocaleString()}</span>
          </div>
          <div class="context-metric">
            <span class="context-metric-label">Turn Output</span>
            <span class="context-metric-val" style="color:#46c764">${active.output.toLocaleString()}</span>
          </div>
          <div class="context-metric">
            <span class="context-metric-label">Tổng tích lũy</span>
            <span class="context-metric-val" style="color:#94a3b8">${formatTokens(cumTokens.input || 0)}</span>
          </div>
        </div>

        <button id="opencode-btn-compact-context" class="opencode-btn-compact" type="button">
          ⚡ Nén ngữ cảnh (Compact Session)
        </button>
      </div>
    `;

    const compactBtn = contextPopoverEl.querySelector('#opencode-btn-compact-context');
    if (compactBtn) {
      compactBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        compactSession(session, compactBtn);
      });
    }
  }

  function findContextButton() {
    const svgCircle = document.querySelector('svg[data-component*="progress-circle"]');
    if (svgCircle) return svgCircle.closest('button');

    const dotsUse = document.querySelector('use[*|href*="dots"], use[href*="dots"]');
    if (dotsUse) {
      const dotsBtn = dotsUse.closest('button');
      const prevTrigger = dotsBtn?.previousElementSibling;
      const btnInPrev = prevTrigger?.querySelector('button') || prevTrigger;
      if (btnInPrev && btnInPrev !== dotsBtn) return btnInPrev;
    }

    return document.querySelector('button[aria-label*="context" i], button[aria-label*="ngữ cảnh" i], button[aria-label*="mức dùng" i]');
  }

  function findExportButton() {
    const downloadUse = document.querySelector('use[*|href*="download"], use[href*="download"]');
    if (downloadUse) return downloadUse.closest('button');

    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => {
      const txt = (b.innerText || '').toLowerCase().trim();
      return txt.includes('export') || txt.includes('xuất');
    });
  }

  async function injectContextPanelCompactBtn() {
    const sessionID = getCurrentSessionID();
    if (!sessionID) return;

    const exportBtn = findExportButton();
    if (!exportBtn) return;

    const parent = exportBtn.parentElement;
    if (!parent || parent.querySelector('#opencode-panel-compact-btn')) return;

    const isVi = document.documentElement.lang?.includes('vi') || exportBtn.innerText.includes('phiên') || exportBtn.innerText.includes('Xuất');
    const label = isVi ? 'Nén ngữ cảnh' : 'Compact session';

    const compactBtn = document.createElement('button');
    compactBtn.id = 'opencode-panel-compact-btn';
    compactBtn.className = 'opencode-panel-compact-btn';
    compactBtn.type = 'button';
    compactBtn.title = isVi ? 'Tóm tắt và nén ngữ cảnh phiên làm việc này' : 'Summarize and reduce context size';
    compactBtn.innerHTML = `⚡ <span>${label}</span>`;

    compactBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      let session = window.__OPENCODE_SESSIONS__?.[sessionID];
      if (!session || !session.model) {
        try {
          const r = await originalFetch('/session/' + encodeURIComponent(sessionID));
          if (r.ok) {
            session = await r.json();
            window.__OPENCODE_SESSIONS__[sessionID] = session;
          }
        } catch {}
      }

      compactSession(session, compactBtn);
    });

    parent.insertBefore(compactBtn, exportBtn);
  }

  function injectHeaderCompactBtn() {
    const sessionID = getCurrentSessionID();
    if (!sessionID) return;

    const contextUsageBtn = findContextButton();
    if (!contextUsageBtn) return;
    const targetParent = contextUsageBtn.parentElement;
    const container = targetParent?.parentElement;
    if (!container || container.querySelector('#opencode-btn-compact-header')) return;

    const isVi = document.documentElement.lang?.includes('vi') || !!document.querySelector('button[aria-label*="tùy chọn" i]') || !!document.querySelector('button[aria-label*="ngữ cảnh" i]');
    const tip = isVi ? 'Nén ngữ cảnh (Compact session)' : 'Compact session';

    const btn = document.createElement('button');
    btn.id = 'opencode-btn-compact-header';
    btn.className = 'opencode-header-compact-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', tip);
    btn.title = tip;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      let session = window.__OPENCODE_SESSIONS__?.[sessionID];
      if (!session || !session.model) {
        try {
          const r = await originalFetch('/session/' + encodeURIComponent(sessionID));
          if (r.ok) {
            session = await r.json();
            window.__OPENCODE_SESSIONS__[sessionID] = session;
          }
        } catch {}
      }

      if (!session?.model?.providerID || !session?.model?.id) {
        showToast('Không tìm thấy thông tin model để nén', 'error');
        return;
      }

      btn.disabled = true;
      btn.classList.add('loading');
      showToast('⏳ Đang nén ngữ cảnh phiên làm việc...', 'info');

      try {
        const resp = await originalFetch('/session/' + encodeURIComponent(sessionID) + '/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerID: session.model.providerID,
            modelID: session.model.id
          })
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.message || 'Lỗi server: ' + resp.status);
        }

        showToast('✓ Đã nén ngữ cảnh thành công!', 'success');

        const updated = await originalFetch('/session/' + encodeURIComponent(sessionID)).then(r => r.json());
        window.__OPENCODE_SESSIONS__[sessionID] = updated;
        renderContextHUD();
      } catch (err) {
        showToast('Lỗi khi nén: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    });

    container.insertBefore(btn, targetParent);
  }

  async function renderContextHUD() {
    const sessionID = getCurrentSessionID();
    if (!sessionID) return;

    const providers = await fetchOnlineProviders();

    let session = window.__OPENCODE_SESSIONS__?.[sessionID];
    if (!session || !session.tokens) {
      try {
        const r = await originalFetch('/session/' + encodeURIComponent(sessionID));
        if (r.ok) {
          session = await r.json();
          window.__OPENCODE_SESSIONS__[sessionID] = session;
        }
      } catch {}
    }

    // Luôn chèn nút Nén ngữ cảnh vào Context panel nếu panel đang mở
    injectContextPanelCompactBtn(session);

    // KIỂM TRA SỐ LIỆU ONLINE CHÍNH XÁC TỪ PROVIDER
    const onlineData = getOnlineModelLimit(providers, session?.model?.providerID, session?.model?.id);

    // NẾU MODEL KHÔNG CÓ SỐ LIỆU NGỮ CẢNH ONLINE CHÍNH XÁC: ẨN HOÀN TOÀN BADGE, ĐỂ MẶC ĐỊNH SẠCH SẼ
    if (!onlineData) {
      document.getElementById('opencode-context-badge')?.remove();
      document.getElementById('opencode-context-badge-prompt')?.remove();
      closeContextPopover();
      return;
    }

    const limit = onlineData.limit;
    const active = getActiveContextTokens(session);
    const total = active.total || 0;
    const pct = Math.min(100, Math.max(1, Math.round((total / limit) * 100)));

    let dotClass = '';
    if (pct > 85) dotClass = 'danger';
    else if (pct > 60) dotClass = 'warning';

    const badgeContent = `
      <span class="context-badge-dot ${dotClass}"></span>
      <span>${formatTokens(total)}/${formatTokens(limit)}</span>
      <span class="context-badge-pct">${pct}%</span>
    `;

    // 1. Chèn vào Header cạnh nút View context usage
    const contextUsageBtn = findContextButton();
    if (contextUsageBtn) {
      const targetParent = contextUsageBtn.parentElement;
      const headerContainer = targetParent?.parentElement;
      if (headerContainer) {
        let badge = headerContainer.querySelector('#opencode-context-badge');
        if (!badge) {
          badge = document.createElement('button');
          badge.id = 'opencode-context-badge';
          badge.className = 'opencode-context-badge';
          badge.type = 'button';
          badge.title = 'Click to inspect Context & Token usage';

          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleContextPopover(window.__OPENCODE_SESSIONS__?.[sessionID] || session, onlineData);
          });

          targetParent.after(badge);
        }
        badge.innerHTML = badgeContent;
      }
    }

    // 2. Chèn vào Input prompt bar trước nút Send
    const sendBtn = document.querySelector('form button[aria-label="Send"]');
    if (sendBtn) {
      const sendParent = sendBtn.parentElement;
      if (sendParent) {
        let promptBadge = sendParent.querySelector('#opencode-context-badge-prompt');
        if (!promptBadge) {
          promptBadge = document.createElement('button');
          promptBadge.id = 'opencode-context-badge-prompt';
          promptBadge.className = 'opencode-context-badge opencode-context-badge-prompt';
          promptBadge.type = 'button';
          promptBadge.title = 'Click to inspect Context & Token usage';

          promptBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleContextPopover(window.__OPENCODE_SESSIONS__?.[sessionID] || session, onlineData);
          });

          sendParent.insertBefore(promptBadge, sendBtn);
        }
        promptBadge.innerHTML = badgeContent;
      }
    }

    if (isContextPopoverOpen) {
      renderContextPopoverContent(session, onlineData);
    }
  }

  let lastSessionId = null;
  function checkSessionChange() {
    const current = getCurrentSessionID();
    if (current && current !== lastSessionId) {
      lastSessionId = current;
      ensurePartLoaded(current).then(() => injectEditButtons());
      renderContextHUD();
    }
  }

  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    if (debounceTimer) return;
    debounceTimer = requestAnimationFrame(() => {
      debounceTimer = null;
      checkSessionChange();
      injectEditButtons();
      unblockAutoAcceptSwitch();
      injectContextPanelCompactBtn();
      injectHeaderCompactBtn();
      renderContextHUD();
    });
  });

  function startObserving() {
    initAutoAcceptSSE();
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
      observer.observe(document.body, { childList: true, subtree: true });
      checkSessionChange();
      setTimeout(injectEditButtons, 500);
      setTimeout(injectEditButtons, 1500);
      setTimeout(unblockAutoAcceptSwitch, 500);
      setTimeout(renderContextHUD, 600);
    } else {
      setTimeout(startObserving, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
  } else {
    startObserving();
  }

  window.addEventListener('popstate', () => {
    checkSessionChange();
    setTimeout(injectEditButtons, 300);
  });

  window.__OPENCODE_AUTO_ACCEPT__ = {
    isActive: () => isAutoAcceptActive(),
    getHandledCount: () => handledPermissions.size,
    getSseStatus: () => globalEventSource ? (globalEventSource.readyState === 1 ? 'OPEN' : 'CONNECTING') : 'CLOSED'
  };

  console.log('[OpenCode WebUI] Gaslight v4 loaded (Auto-Accept Unblocked)');
})();
