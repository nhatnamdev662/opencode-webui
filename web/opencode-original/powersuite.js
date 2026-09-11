// OpenCode WebUI Native Tools v3.0
// 100% Seamless alignment with OpenCode Core design language.
// Seamlessly embeds into OpenCode's header using identical icon-button metrics, tooltips, and tokens.

(function() {
  'use strict';

  const STYLE = document.createElement('style');
  STYLE.id = 'opencode-native-tools-style';
  STYLE.textContent = `
    .opencode-tools-group {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      margin-left: auto;
      margin-right: 4px;
      flex-shrink: 0;
      z-index: 30;
    }

    /* Exact clone of OpenCode's icon-button-v2 ghost-muted */
    .opencode-tool-icon-btn {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border-radius: 6px;
      background: transparent;
      border: none;
      color: var(--v2-text-text-faint, #8f8f8f);
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
      position: relative;
    }
    .opencode-tool-icon-btn:hover {
      background: var(--v2-overlay-simple-overlay-hover, rgba(255,255,255,0.06));
      color: var(--v2-text-text-base, #ffffff);
    }
    .opencode-tool-icon-btn.active {
      background: var(--v2-overlay-simple-overlay-active, rgba(255,255,255,0.1));
      color: var(--v2-text-text-base, #ffffff);
    }
    .opencode-tool-icon-btn svg {
      width: 16px;
      height: 16px;
      pointer-events: none;
    }

    /* OpenCode standard dialog-v2 */
    .opencode-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      z-index: 99990;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: opencode-fade-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes opencode-fade-in {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
    .opencode-modal-content {
      background: var(--v2-background-bg-base, #121212);
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
      border-radius: 12px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: var(--v2-text-text-base, #e6edf3);
    }
    .opencode-modal-header {
      height: 48px;
      padding: 0 16px;
      border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
    }
    .opencode-modal-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--v2-text-text-base, #f0f6fc);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .opencode-modal-close {
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--v2-text-text-faint, #8f8f8f);
      cursor: pointer;
      font-size: 14px;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .opencode-modal-close:hover {
      background: var(--v2-overlay-simple-overlay-hover, rgba(255,255,255,0.08));
      color: var(--v2-text-text-base, #ffffff);
    }
    .opencode-modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    /* Timeline Turn Cards */
    .ops-turn-card {
      background: var(--v2-background-bg-deep, #161616);
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;
      transition: border-color 0.15s ease;
    }
    .ops-turn-card:hover {
      border-color: rgba(255, 255, 255, 0.15);
    }
    .ops-turn-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ops-turn-badge {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.06);
      color: var(--v2-text-text-base, #ffffff);
    }
    .ops-turn-badge.assistant { color: #3fb950; background: rgba(46, 160, 67, 0.12); }
    .ops-turn-badge.user { color: #58a6ff; background: rgba(56, 139, 253, 0.12); }
    .ops-turn-time { font-size: 11px; color: var(--v2-text-text-faint, #888); }
    .ops-turn-body { font-size: 12.5px; line-height: 1.5; color: var(--v2-text-text-base, #d0d7de); }
    .ops-turn-btn {
      align-self: flex-start;
      margin-top: 4px;
      padding: 4px 10px;
      font-size: 11.5px;
      font-weight: 500;
      border-radius: 6px;
      border: 1px solid rgba(248, 81, 73, 0.3);
      color: #f85149;
      background: transparent;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .ops-turn-btn:hover { background: rgba(248, 81, 73, 0.15); border-color: #f85149; }

    /* Models Status Cards */
    .ops-models-layout {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 10px;
    }
    .ops-model-item {
      background: var(--v2-background-bg-deep, #161616);
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ops-model-item-top { display: flex; align-items: center; justify-content: space-between; }
    .ops-model-title { font-size: 13px; font-weight: 600; color: var(--v2-text-text-base, #f0f6fc); }
    .ops-status-badge { font-size: 10.5px; font-weight: 500; padding: 2px 7px; border-radius: 12px; }
    .ops-status-badge.connected { color: #3fb950; background: rgba(46, 160, 67, 0.12); }
    .ops-status-badge.unconfigured { color: #888; background: rgba(255, 255, 255, 0.04); }

    /* Native Split View */
    .opencode-split-viewport {
      position: fixed;
      top: 36px;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--v2-background-bg-deep, #080808);
      z-index: 99980;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 6px;
    }
    .opencode-split-card {
      background: var(--v2-background-bg-base, #121212);
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .opencode-split-card-header {
      height: 36px;
      padding: 0 12px;
      border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: var(--v2-text-text-faint, #8f8f8f);
    }
    .opencode-split-select {
      background: var(--v2-background-bg-deep, #161616);
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
      color: var(--v2-text-text-base, #e6edf3);
      border-radius: 5px;
      padding: 2px 6px;
      font-size: 11.5px;
      outline: none;
    }
    .opencode-split-frame { flex: 1; width: 100%; height: 100%; border: none; }
  `;
  document.head.appendChild(STYLE);

  function getCurrentSessionID() {
    const match = window.location.href.match(/ses_[a-zA-Z0-9]+/);
    return match ? match[0] : null;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function closeDialogs() {
    document.querySelectorAll('.opencode-modal-backdrop').forEach(el => el.remove());
  }

  // 1. Files: Tận dụng hoàn toàn panel Files gốc của OpenCode
  function toggleFilesPanel() {
    const reviewBtn = document.querySelector('button[aria-label="Toggle review"]');
    const isExpanded = reviewBtn?.getAttribute('aria-expanded') === 'true';

    if (!isExpanded && reviewBtn) {
      reviewBtn.click();
    }

    setTimeout(() => {
      const toggleTreeBtn = document.querySelector('button[aria-label="Toggle file tree"]');
      if (toggleTreeBtn && toggleTreeBtn.getAttribute('aria-expanded') !== 'true') {
        toggleTreeBtn.click();
      }
    }, 120);
  }

  // 2. Timeline Dialog
  async function openTimeline() {
    closeDialogs();
    const sid = getCurrentSessionID();
    if (!sid) return;

    const overlay = document.createElement('div');
    overlay.className = 'opencode-modal-backdrop';
    overlay.innerHTML = `
      <div class="opencode-modal-content" style="width: 720px; max-width: 90%; height: 75vh;">
        <div class="opencode-modal-header">
          <div class="opencode-modal-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><use href="#opencode-v2-icon-reset"></use></svg>
            Session History & Rollback
          </div>
          <button class="opencode-modal-close" title="Close">✕</button>
        </div>
        <div class="opencode-modal-body" id="ops-timeline-body">
          <div style="font-size: 12px; color: #888;">Loading history...</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.opencode-modal-close');
    const container = overlay.querySelector('#ops-timeline-body');
    const close = () => overlay.remove();
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    try {
      const resp = await fetch(`/session/${sid}/message`);
      const msgs = await resp.json();

      if (!Array.isArray(msgs) || msgs.length === 0) {
        container.innerHTML = '<div style="font-size: 12px; color: #888;">No messages in this session.</div>';
        return;
      }

      container.innerHTML = '';
      msgs.forEach((msg, idx) => {
        const textPart = (msg.parts || []).find(p => p.type === 'text');
        const snippet = textPart?.text ? textPart.text.slice(0, 160).trim() + (textPart.text.length > 160 ? '...' : '') : '(Action / Tool execution turn)';
        const timeStr = msg.info.time?.created ? new Date(msg.info.time.created).toLocaleTimeString() : '';

        const card = document.createElement('div');
        card.className = 'ops-turn-card';
        card.innerHTML = `
          <div class="ops-turn-header">
            <span class="ops-turn-badge ${msg.info.role}">#${idx + 1} ${msg.info.role}</span>
            <span class="ops-turn-time">${timeStr}</span>
          </div>
          <div class="ops-turn-body">${escapeHtml(snippet)}</div>
          <button class="ops-turn-btn" data-msg-id="${msg.info.id}">
            Revert session to this turn
          </button>
        `;

        const btn = card.querySelector('.ops-turn-btn');
        btn.addEventListener('click', async () => {
          if (!confirm(`Revert session to message #${idx + 1}? Subsequent changes will be reverted.`)) return;
          btn.disabled = true;
          btn.textContent = 'Reverting...';
          try {
            const r = await fetch(`/session/${sid}/revert`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messageID: msg.info.id })
            });
            if (r.ok) {
              close();
              window.location.reload();
            } else {
              alert('Revert failed: ' + await r.text());
              btn.disabled = false;
              btn.textContent = 'Revert session to this turn';
            }
          } catch (err) {
            alert('Network error: ' + err.message);
            btn.disabled = false;
            btn.textContent = 'Revert session to this turn';
          }
        });

        container.appendChild(card);
      });
    } catch (err) {
      container.innerHTML = `<div style="font-size: 12px; color: #f85149;">Error: ${err.message}</div>`;
    }
  }

  // 3. Models Dialog
  async function openModels() {
    closeDialogs();
    const overlay = document.createElement('div');
    overlay.className = 'opencode-modal-backdrop';
    overlay.innerHTML = `
      <div class="opencode-modal-content" style="width: 820px; max-width: 90%; height: 75vh;">
        <div class="opencode-modal-header">
          <div class="opencode-modal-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><use href="#opencode-v2-icon-status"></use></svg>
            Providers & Models Status
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button id="ops-ping-btn" style="height:24px;padding:0 8px;font-size:11px;font-weight:500;border-radius:5px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:var(--v2-text-text-base);cursor:pointer;">Test Ping</button>
            <button class="opencode-modal-close" title="Close">✕</button>
          </div>
        </div>
        <div class="opencode-modal-body" id="ops-models-body">
          <div style="font-size: 12px; color: #888;">Loading providers...</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.opencode-modal-close');
    const container = overlay.querySelector('#ops-models-body');
    const pingBtn = overlay.querySelector('#ops-ping-btn');
    const close = () => overlay.remove();
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    try {
      const resp = await fetch('/provider');
      const data = await resp.json();
      const connected = new Set(data.connected || []);
      const allProviders = data.all || [];

      const sorted = [...allProviders].sort((a, b) => {
        const aConn = connected.has(a.id) ? 1 : 0;
        const bConn = connected.has(b.id) ? 1 : 0;
        return bConn - aConn;
      });

      container.innerHTML = '<div class="ops-models-layout"></div>';
      const grid = container.querySelector('.ops-models-layout');

      sorted.slice(0, 36).forEach(prov => {
        const isConn = connected.has(prov.id);
        const card = document.createElement('div');
        card.className = 'ops-model-item';

        const models = Object.keys(prov.models || {});
        const sample = models.slice(0, 3).join(', ') + (models.length > 3 ? ` +${models.length - 3}` : '');

        card.innerHTML = `
          <div class="ops-model-item-top">
            <span class="ops-model-title">${escapeHtml(prov.name || prov.id)}</span>
            <span class="ops-status-badge ${isConn ? 'connected' : 'unconfigured'}">
              ${isConn ? '● Connected' : 'Inactive'}
            </span>
          </div>
          <div style="font-size: 11.5px; color: #888; line-height: 1.4;">
            ${models.length > 0 ? escapeHtml(sample) : 'No registered models'}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
            <span id="ops-ping-${prov.id}" style="font-size: 11px; font-family: monospace; color: #3fb950;"></span>
            <span style="font-size: 10px; color: #666; font-family: monospace;">${prov.id}</span>
          </div>
        `;
        grid.appendChild(card);
      });

      pingBtn.addEventListener('click', async () => {
        pingBtn.disabled = true;
        pingBtn.textContent = 'Pinging...';
        for (const provId of connected) {
          const badge = grid.querySelector(`#ops-ping-${provId}`);
          if (badge) badge.textContent = '...';
          const t0 = performance.now();
          try {
            await fetch(`/provider/${provId}`);
            const ms = Math.round(performance.now() - t0);
            if (badge) badge.textContent = `${ms}ms`;
          } catch {
            if (badge) badge.textContent = 'err';
          }
        }
        pingBtn.disabled = false;
        pingBtn.textContent = 'Test Ping';
      });

    } catch (err) {
      container.innerHTML = `<div style="font-size: 12px; color: #f85149;">Error: ${err.message}</div>`;
    }
  }

  // 4. Split Monitor
  let splitActive = false;
  async function toggleSplit() {
    if (splitActive) {
      document.querySelector('.opencode-split-viewport')?.remove();
      splitActive = false;
      return;
    }

    const sessions = await (await fetch('/session')).json();
    if (!Array.isArray(sessions) || sessions.length < 2) {
      alert('Need at least 2 sessions to split view.');
      return;
    }

    splitActive = true;
    const wrapper = document.createElement('div');
    wrapper.className = 'opencode-split-viewport';

    function options(cur) {
      return sessions.map(s => `
        <option value="${s.id}" ${s.id === cur ? 'selected' : ''}>
          ${escapeHtml(s.title || s.slug || s.id)}
        </option>
      `).join('');
    }

    const s1 = sessions[0].id;
    const s2 = sessions[1].id;

    wrapper.innerHTML = `
      <div class="opencode-split-card">
        <div class="opencode-split-card-header">
          <span>Session 1: <select class="opencode-split-select" id="ops-s1">${options(s1)}</select></span>
          <button style="background:transparent;border:none;color:#888;cursor:pointer;" class="ops-close-split">✕</button>
        </div>
        <iframe class="opencode-split-frame" id="ops-frame-1" src="/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${s1}"></iframe>
      </div>
      <div class="opencode-split-card">
        <div class="opencode-split-card-header">
          <span>Session 2: <select class="opencode-split-select" id="ops-s2">${options(s2)}</select></span>
          <button style="background:transparent;border:none;color:#888;cursor:pointer;" class="ops-close-split">✕</button>
        </div>
        <iframe class="opencode-split-frame" id="ops-frame-2" src="/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${s2}"></iframe>
      </div>
    `;

    document.body.appendChild(wrapper);

    wrapper.querySelectorAll('.ops-close-split').forEach(b => {
      b.addEventListener('click', () => {
        wrapper.remove();
        splitActive = false;
      });
    });

    const sel1 = wrapper.querySelector('#ops-s1');
    const sel2 = wrapper.querySelector('#ops-s2');
    sel1.addEventListener('change', () => {
      wrapper.querySelector('#ops-frame-1').src = `/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${sel1.value}`;
    });
    sel2.addEventListener('change', () => {
      wrapper.querySelector('#ops-frame-2').src = `/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${sel2.value}`;
    });
  }

  // Inject buttons adhering 100% to OpenCode's header icon buttons
  function injectNativeHeaderButtons() {
    if (document.getElementById('opencode-tools-group')) return;

    const header = document.querySelector('header > div');
    if (!header) return;

    // Clean up any old containers
    document.getElementById('ops-header-bar')?.remove();

    const bar = document.createElement('div');
    bar.id = 'opencode-tools-group';
    bar.className = 'opencode-tools-group';

    bar.innerHTML = `
      <button type="button" class="opencode-tool-icon-btn" id="ops-btn-files" title="Project Files (Explorer)" aria-label="Project Files">
        <svg fill="none" viewBox="0 0 16 16" aria-hidden="true"><use href="#opencode-v2-icon-filetree"></use></svg>
      </button>
      <button type="button" class="opencode-tool-icon-btn" id="ops-btn-timeline" title="Timeline & Rollback" aria-label="Timeline">
        <svg fill="none" viewBox="0 0 16 16" aria-hidden="true"><use href="#opencode-v2-icon-reset"></use></svg>
      </button>
      <button type="button" class="opencode-tool-icon-btn" id="ops-btn-models" title="AI Providers & Models Status" aria-label="Models">
        <svg fill="none" viewBox="0 0 16 16" aria-hidden="true"><use href="#opencode-v2-icon-status"></use></svg>
      </button>
      <button type="button" class="opencode-tool-icon-btn" id="ops-btn-split" title="Multi-Session Split Screen" aria-label="Split Screen">
        <svg fill="none" viewBox="0 0 16 16" aria-hidden="true"><use href="#opencode-v2-icon-split"></use></svg>
      </button>
    `;

    bar.querySelector('#ops-btn-files').addEventListener('click', toggleFilesPanel);
    bar.querySelector('#ops-btn-timeline').addEventListener('click', openTimeline);
    bar.querySelector('#ops-btn-models').addEventListener('click', openModels);
    bar.querySelector('#ops-btn-split').addEventListener('click', toggleSplit);

    header.appendChild(bar);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDialogs();
  });

  const observer = new MutationObserver(() => {
    injectNativeHeaderButtons();
  });

  function start() {
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
      injectNativeHeaderButtons();
      setTimeout(injectNativeHeaderButtons, 500);
      setTimeout(injectNativeHeaderButtons, 1500);
    } else {
      setTimeout(start, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  console.log('[OpenCode WebUI] Native Tools v3.0 loaded');
})();
