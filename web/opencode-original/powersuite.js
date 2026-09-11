// OpenCode WebUI Pro Suite v4.0
// High-grade professional tools seamlessly integrated into OpenCode.
// 1. Session Timeline & Time-Machine Rollback (Rich details: token usage, tool calls, preview, single-turn revert)
// 2. Providers & Models Control Center (Search, filter connected, latency benchmark, model specs)
// 3. Multi-Session Split Monitor (Grid controls, sync navigation, fast switcher)

(function() {
  'use strict';

  // OpenCode Theme Adaptive Styles
  const STYLE = document.createElement('style');
  STYLE.id = 'opencode-pro-suite-style';
  STYLE.textContent = `
    /* Header Tools Group */
    .opencode-suite-toolbar {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      margin-left: auto;
      margin-right: 6px;
      flex-shrink: 0;
      z-index: 30;
      padding: 2px 4px;
      border-radius: 8px;
      background: var(--v2-background-bg-base, #1c1c1c);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.15));
    }

    .opencode-suite-btn {
      height: 24px;
      padding: 0 8px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border-radius: 5px;
      background: transparent;
      border: none;
      color: var(--v2-text-text-faint, #8f8f8f);
      font-size: 11px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
    }
    .opencode-suite-btn:hover {
      background: var(--v2-overlay-simple-overlay-hover, rgba(128,128,128,0.12));
      color: var(--v2-text-text-base, #ffffff);
    }
    .opencode-suite-btn.active {
      background: var(--v2-overlay-simple-overlay-active, rgba(128,128,128,0.2));
      color: var(--v2-text-text-base, #ffffff);
    }
    .opencode-suite-btn svg {
      width: 13px;
      height: 13px;
      pointer-events: none;
      flex-shrink: 0;
    }

    /* Modal Backdrop */
    .opencode-pro-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(6px);
      z-index: 99990;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: ops-zoom-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes ops-zoom-in {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Professional Modal Box */
    .opencode-pro-dialog {
      background: var(--v2-background-bg-base, #161b22);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.2));
      border-radius: 12px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.65);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: var(--v2-text-text-base, #e6edf3);
      font-family: inherit;
    }

    /* Modal Header */
    .opencode-pro-header {
      height: 48px;
      padding: 0 18px;
      border-bottom: 1px solid var(--border-subtle, rgba(128,128,128,0.15));
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--v2-background-bg-deep, #0f1318);
      user-select: none;
    }
    .opencode-pro-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--v2-text-text-base, #f0f6fc);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .opencode-pro-close {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--v2-text-text-faint, #8f8f8f);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.12s ease;
    }
    .opencode-pro-close:hover {
      background: rgba(128,128,128,0.15);
      color: #fff;
    }

    /* Modal Sub-Navbar & Filters */
    .opencode-pro-filterbar {
      padding: 10px 18px;
      background: var(--v2-background-bg-deep, #0d1117);
      border-bottom: 1px solid var(--border-subtle, rgba(128,128,128,0.1));
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .opencode-pro-input {
      flex: 1;
      background: var(--v2-background-bg-base, #161b22);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.25));
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      color: var(--v2-text-text-base, #e6edf3);
      outline: none;
      transition: border-color 0.15s ease;
    }
    .opencode-pro-input:focus {
      border-color: #58a6ff;
    }
    .opencode-action-btn {
      height: 30px;
      padding: 0 12px;
      font-size: 11.5px;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      user-select: none;
      white-space: nowrap;
    }
    .opencode-action-btn-primary {
      background: #238636;
      border-color: #2ea043;
      color: #ffffff;
    }
    .opencode-action-btn-primary:hover {
      background: #2ea043;
    }
    .opencode-action-btn-secondary {
      background: var(--v2-background-bg-base, #21262d);
      border-color: var(--border-subtle, rgba(128,128,128,0.25));
      color: var(--v2-text-text-base, #c9d1d9);
    }
    .opencode-action-btn-secondary:hover {
      background: rgba(128,128,128,0.15);
      color: #ffffff;
    }

    /* Modal Body */
    .opencode-pro-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 18px;
    }

    /* Professional Timeline Cards */
    .ops-timeline-v4 {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ops-turn-row {
      background: var(--v2-background-bg-deep, #0d1117);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.18));
      border-radius: 8px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.15s ease;
    }
    .ops-turn-row:hover {
      border-color: rgba(128,128,128,0.35);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .ops-turn-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .ops-turn-role-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      font-family: monospace;
    }
    .ops-turn-role-badge.user {
      background: rgba(56,139,253,0.15);
      color: #58a6ff;
      border: 1px solid rgba(56,139,253,0.3);
    }
    .ops-turn-role-badge.assistant {
      background: rgba(46,160,67,0.15);
      color: #3fb950;
      border: 1px solid rgba(46,160,67,0.3);
    }
    .ops-turn-stats {
      font-size: 11px;
      color: var(--v2-text-text-faint, #8b949e);
      font-family: monospace;
      display: flex;
      gap: 12px;
    }
    .ops-turn-content {
      font-size: 12.5px;
      line-height: 1.6;
      color: var(--v2-text-text-base, #c9d1d9);
      max-height: 120px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
      background: var(--v2-background-bg-base, #161b22);
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid rgba(128,128,128,0.1);
    }
    .ops-tools-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 2px;
    }
    .ops-tool-tag {
      font-size: 10.5px;
      font-family: monospace;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(163,113,247,0.12);
      color: #bc8cff;
      border: 1px solid rgba(163,113,247,0.25);
    }
    .ops-rollback-action-btn {
      align-self: flex-end;
      height: 26px;
      padding: 0 10px;
      font-size: 11px;
      font-weight: 600;
      color: #f85149;
      background: rgba(248,81,73,0.08);
      border: 1px solid rgba(248,81,73,0.3);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .ops-rollback-action-btn:hover {
      background: rgba(248,81,73,0.2);
      border-color: #f85149;
      color: #ff7b72;
    }

    /* Providers & Models Control Center */
    .ops-providers-grid-v4 {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 12px;
    }
    .ops-prov-card-v4 {
      background: var(--v2-background-bg-deep, #0d1117);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.18));
      border-radius: 8px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.15s ease;
    }
    .ops-prov-card-v4:hover {
      border-color: rgba(128,128,128,0.35);
    }
    .ops-prov-card-v4.is-connected {
      border-left: 3px solid #3fb950;
    }
    .ops-prov-header-v4 {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ops-prov-name-v4 {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--v2-text-text-base, #f0f6fc);
    }
    .ops-prov-badge-v4 {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 12px;
      font-family: monospace;
    }
    .ops-prov-badge-v4.connected {
      background: rgba(46,160,67,0.15);
      color: #3fb950;
      border: 1px solid rgba(46,160,67,0.3);
    }
    .ops-prov-badge-v4.unconfigured {
      background: rgba(128,128,128,0.1);
      color: #8b949e;
      border: 1px solid rgba(128,128,128,0.2);
    }
    .ops-prov-models-v4 {
      font-size: 11.5px;
      color: var(--v2-text-text-faint, #8b949e);
      line-height: 1.5;
    }
    .ops-prov-footer-v4 {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
      padding-top: 6px;
      border-top: 1px solid rgba(128,128,128,0.08);
    }
    .ops-latency-tag {
      font-size: 11px;
      font-family: monospace;
      color: #3fb950;
      font-weight: 600;
    }

    /* Split Screen Monitor */
    .ops-split-viewport-v4 {
      position: fixed;
      top: 36px;
      inset-inline: 0;
      bottom: 0;
      background: var(--v2-background-bg-deep, #080808);
      z-index: 99980;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 6px;
    }
    .ops-split-pane-v4 {
      background: var(--v2-background-bg-base, #121212);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.2));
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .ops-split-bar-v4 {
      height: 38px;
      padding: 0 14px;
      background: var(--v2-background-bg-deep, #0d1117);
      border-bottom: 1px solid var(--border-subtle, rgba(128,128,128,0.15));
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: var(--v2-text-text-faint, #8f8f8f);
    }
    .ops-split-select-v4 {
      background: var(--v2-background-bg-base, #161b22);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.25));
      color: var(--v2-text-text-base, #e6edf3);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11.5px;
      outline: none;
      max-width: 240px;
    }
    .ops-split-iframe-v4 {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
    }
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
    document.querySelectorAll('.opencode-pro-overlay').forEach(el => el.remove());
  }

  // 1. Files: Tự động kích hoạt panel Files gốc của OpenCode
  function triggerNativeFiles() {
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

  // 2. Timeline & Time-Machine Pro
  async function openTimeline() {
    closeDialogs();
    const sid = getCurrentSessionID();
    if (!sid) {
      alert('Please open a session first.');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'opencode-pro-overlay';
    overlay.innerHTML = `
      <div class="opencode-pro-dialog" style="width: 860px; max-width: 92%; height: 80vh;">
        <div class="opencode-pro-header">
          <div class="opencode-pro-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><use href="#opencode-v2-icon-reset"></use></svg>
            Session History & Time-Machine Rollback
            <span style="font-size: 11px; font-weight: 400; color: #8b949e; font-family: monospace;">(${sid})</span>
          </div>
          <button class="opencode-pro-close" title="Close (Esc)">✕</button>
        </div>
        <div class="opencode-pro-filterbar">
          <input type="text" class="opencode-pro-input" id="ops-timeline-search" placeholder="Search turns by prompt, tool or output content..." />
          <span style="font-size: 11px; color: #8b949e; font-family: monospace;" id="ops-timeline-count">Loading...</span>
        </div>
        <div class="opencode-pro-body" id="ops-timeline-body">
          <div style="font-size: 12px; color: #888;">Loading turn history...</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.opencode-pro-close');
    const searchInput = overlay.querySelector('#ops-timeline-search');
    const countEl = overlay.querySelector('#ops-timeline-count');
    const bodyEl = overlay.querySelector('#ops-timeline-body');

    const close = () => overlay.remove();
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    try {
      const resp = await fetch(`/session/${sid}/message`);
      const msgs = await resp.json();

      if (!Array.isArray(msgs) || msgs.length === 0) {
        bodyEl.innerHTML = '<div style="font-size: 12px; color: #888;">No messages in this session yet.</div>';
        countEl.textContent = '0 turns';
        return;
      }

      let allTurns = msgs;

      function render(turns) {
        bodyEl.innerHTML = '<div class="ops-timeline-v4"></div>';
        const list = bodyEl.querySelector('.ops-timeline-v4');
        countEl.textContent = `${turns.length} turns`;

        if (turns.length === 0) {
          bodyEl.innerHTML = '<div style="font-size: 12px; color: #888;">No turns matched your search.</div>';
          return;
        }

        turns.forEach((msg, idx) => {
          const row = document.createElement('div');
          row.className = 'ops-turn-row';

          const role = msg.info?.role || 'assistant';
          const time = msg.info?.time?.created ? new Date(msg.info.time.created).toLocaleTimeString() : '';
          const tokens = msg.info?.tokens ? `${(msg.info.tokens.total || 0).toLocaleString()} tokens` : '';

          // Extract tools called
          const toolCalls = (msg.parts || []).filter(p => p.type === 'tool').map(p => p.tool).filter(Boolean);

          // Extract text
          const textPart = (msg.parts || []).find(p => p.type === 'text');
          const reasoningPart = (msg.parts || []).find(p => p.type === 'reasoning');
          const snippet = textPart?.text || reasoningPart?.text || (toolCalls.length > 0 ? `Executed tools: ${toolCalls.join(', ')}` : '(Empty turn)');

          row.innerHTML = `
            <div class="ops-turn-meta">
              <span class="ops-turn-role-badge ${role}">#${idx + 1} ${role}</span>
              <div class="ops-turn-stats">
                ${tokens ? `<span>${tokens}</span>` : ''}
                <span>${time}</span>
              </div>
            </div>
            <div class="ops-turn-content">${escapeHtml(snippet.slice(0, 500))}${snippet.length > 500 ? '...' : ''}</div>
            ${toolCalls.length > 0 ? `
              <div class="ops-tools-tags">
                ${toolCalls.map(t => `<span class="ops-tool-tag">🔧 ${escapeHtml(t)}</span>`).join('')}
              </div>
            ` : ''}
            <button class="ops-rollback-action-btn" data-msg-id="${msg.info.id}">
              ⏮ Revert session to this turn
            </button>
          `;

          const revertBtn = row.querySelector('.ops-rollback-action-btn');
          revertBtn.addEventListener('click', async () => {
            if (!confirm(`Are you sure you want to revert session to turn #${idx + 1}? All actions taken after this message will be permanently rolled back.`)) {
              return;
            }
            revertBtn.disabled = true;
            revertBtn.textContent = 'Reverting...';
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
                alert('Failed to revert: ' + await r.text());
                revertBtn.disabled = false;
                revertBtn.textContent = '⏮ Revert session to this turn';
              }
            } catch (err) {
              alert('Network error: ' + err.message);
              revertBtn.disabled = false;
              revertBtn.textContent = '⏮ Revert session to this turn';
            }
          });

          list.appendChild(row);
        });
      }

      render(allTurns);

      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim();
        if (!q) {
          render(allTurns);
        } else {
          const filtered = allTurns.filter(m => {
            const fullText = (m.parts || []).map(p => p.text || p.tool || '').join(' ').toLowerCase();
            return fullText.includes(q);
          });
          render(filtered);
        }
      });

    } catch (err) {
      bodyEl.innerHTML = `<div style="font-size: 12px; color: #f85149;">Error loading history: ${err.message}</div>`;
    }
  }

  // 3. Models & Providers Control Center
  async function openModels() {
    closeDialogs();
    const overlay = document.createElement('div');
    overlay.className = 'opencode-pro-overlay';
    overlay.innerHTML = `
      <div class="opencode-pro-dialog" style="width: 960px; max-width: 92%; height: 82vh;">
        <div class="opencode-pro-header">
          <div class="opencode-pro-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><use href="#opencode-v2-icon-status"></use></svg>
            AI Providers & Models Control Center
          </div>
          <button class="opencode-pro-close" title="Close (Esc)">✕</button>
        </div>
        <div class="opencode-pro-filterbar">
          <input type="text" class="opencode-pro-input" id="ops-model-search" placeholder="Filter providers or search model names..." />
          <button class="opencode-action-btn opencode-action-btn-secondary" id="ops-filter-connected-btn">
            Show Connected Only
          </button>
          <button class="opencode-action-btn opencode-action-btn-primary" id="ops-ping-all-btn">
            ⚡ Benchmark Latency
          </button>
        </div>
        <div class="opencode-pro-body" id="ops-models-body">
          <div style="font-size: 12px; color: #888;">Loading providers...</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.opencode-pro-close');
    const searchInput = overlay.querySelector('#ops-model-search');
    const filterConnBtn = overlay.querySelector('#ops-filter-connected-btn');
    const pingBtn = overlay.querySelector('#ops-ping-all-btn');
    const bodyEl = overlay.querySelector('#ops-models-body');

    const close = () => overlay.remove();
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    try {
      const resp = await fetch('/provider');
      const data = await resp.json();
      const connected = new Set(data.connected || []);
      const allProviders = data.all || [];

      let showOnlyConnected = false;

      function render() {
        const q = searchInput.value.toLowerCase().trim();
        let list = allProviders;

        if (showOnlyConnected) {
          list = list.filter(p => connected.has(p.id));
        }

        if (q) {
          list = list.filter(p => {
            const name = (p.name || p.id).toLowerCase();
            const models = Object.keys(p.models || {}).join(' ').toLowerCase();
            return name.includes(q) || models.includes(q);
          });
        }

        const sorted = [...list].sort((a, b) => {
          const aConn = connected.has(a.id) ? 1 : 0;
          const bConn = connected.has(b.id) ? 1 : 0;
          return bConn - aConn;
        });

        bodyEl.innerHTML = '<div class="ops-providers-grid-v4"></div>';
        const grid = bodyEl.querySelector('.ops-providers-grid-v4');

        if (sorted.length === 0) {
          bodyEl.innerHTML = '<div style="font-size: 12px; color: #888;">No providers matched your filter.</div>';
          return;
        }

        sorted.forEach(prov => {
          const isConn = connected.has(prov.id);
          const card = document.createElement('div');
          card.className = 'ops-prov-card-v4' + (isConn ? ' is-connected' : '');

          const models = Object.keys(prov.models || {});
          const sample = models.slice(0, 3).join(', ') + (models.length > 3 ? ` +${models.length - 3} more` : '');

          card.innerHTML = `
            <div class="ops-prov-header-v4">
              <span class="ops-prov-name-v4">${escapeHtml(prov.name || prov.id)}</span>
              <span class="ops-prov-badge-v4 ${isConn ? 'connected' : 'unconfigured'}">
                ${isConn ? '● Active' : 'Unconfigured'}
              </span>
            </div>
            <div class="ops-prov-models-v4">
              ${models.length > 0 ? escapeHtml(sample) : 'No registered models'}
            </div>
            <div class="ops-prov-footer-v4">
              <span class="ops-latency-tag" id="ops-ping-tag-${prov.id}"></span>
              <span style="font-size: 10px; color: #6e7681; font-family: monospace;">${prov.id}</span>
            </div>
          `;
          grid.appendChild(card);
        });
      }

      render();

      filterConnBtn.addEventListener('click', () => {
        showOnlyConnected = !showOnlyConnected;
        filterConnBtn.style.background = showOnlyConnected ? 'rgba(56,139,253,0.2)' : '';
        filterConnBtn.style.borderColor = showOnlyConnected ? '#58a6ff' : '';
        render();
      });

      searchInput.addEventListener('input', render);

      pingBtn.addEventListener('click', async () => {
        pingBtn.disabled = true;
        pingBtn.textContent = 'Benchmarking...';
        for (const provId of connected) {
          const tag = bodyEl.querySelector(`#ops-ping-tag-${provId}`);
          if (tag) tag.textContent = '...';
          const t0 = performance.now();
          try {
            await fetch(`/provider/${provId}`);
            const ms = Math.round(performance.now() - t0);
            if (tag) tag.textContent = `${ms}ms`;
          } catch {
            if (tag) tag.textContent = 'err';
          }
        }
        pingBtn.disabled = false;
        pingBtn.textContent = '⚡ Benchmark Latency';
      });

    } catch (err) {
      bodyEl.innerHTML = `<div style="font-size: 12px; color: #f85149;">Error: ${err.message}</div>`;
    }
  }

  // 4. Multi-Session Split Monitor
  let splitActive = false;
  async function toggleSplit() {
    if (splitActive) {
      document.querySelector('.ops-split-viewport-v4')?.remove();
      splitActive = false;
      return;
    }

    const sessions = await (await fetch('/session')).json();
    if (!Array.isArray(sessions) || sessions.length < 2) {
      alert('Need at least 2 sessions to split view.');
      return;
    }

    splitActive = true;
    const viewport = document.createElement('div');
    viewport.className = 'ops-split-viewport-v4';

    function options(cur) {
      return sessions.map(s => `
        <option value="${s.id}" ${s.id === cur ? 'selected' : ''}>
          ${escapeHtml(s.title || s.slug || s.id)}
        </option>
      `).join('');
    }

    const s1 = sessions[0].id;
    const s2 = sessions[1].id;

    viewport.innerHTML = `
      <div class="ops-split-pane-v4">
        <div class="ops-split-bar-v4">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>Left:</span>
            <select class="ops-split-select-v4" id="ops-split-s1">${options(s1)}</select>
          </div>
          <button style="background:transparent;border:none;color:#888;cursor:pointer;font-size:14px;" class="ops-split-close-btn">✕ Close Split</button>
        </div>
        <iframe class="ops-split-iframe-v4" id="ops-split-frame-1" src="/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${s1}"></iframe>
      </div>
      <div class="ops-split-pane-v4">
        <div class="ops-split-bar-v4">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>Right:</span>
            <select class="ops-split-select-v4" id="ops-split-s2">${options(s2)}</select>
          </div>
          <button style="background:transparent;border:none;color:#888;cursor:pointer;font-size:14px;" class="ops-split-close-btn">✕ Close Split</button>
        </div>
        <iframe class="ops-split-iframe-v4" id="ops-split-frame-2" src="/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${s2}"></iframe>
      </div>
    `;

    document.body.appendChild(viewport);

    viewport.querySelectorAll('.ops-split-close-btn').forEach(b => {
      b.addEventListener('click', () => {
        viewport.remove();
        splitActive = false;
      });
    });

    const sel1 = viewport.querySelector('#ops-split-s1');
    const sel2 = viewport.querySelector('#ops-split-s2');
    sel1.addEventListener('change', () => {
      viewport.querySelector('#ops-split-frame-1').src = `/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${sel1.value}`;
    });
    sel2.addEventListener('change', () => {
      viewport.querySelector('#ops-split-frame-2').src = `/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${sel2.value}`;
    });
  }

  // Inject Toolbar
  function injectToolbar() {
    if (document.getElementById('opencode-suite-toolbar')) return;

    const header = document.querySelector('header > div');
    if (!header) return;

    const bar = document.createElement('div');
    bar.id = 'opencode-suite-toolbar';
    bar.className = 'opencode-suite-toolbar';

    bar.innerHTML = `
      <button type="button" class="opencode-suite-btn" id="ops-btn-files" title="Open workspace file tree and code editor">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><use href="#opencode-v2-icon-filetree"></use></svg>
        Files
      </button>
      <button type="button" class="opencode-suite-btn" id="ops-btn-timeline" title="Turn history & 1-click rollback">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><use href="#opencode-v2-icon-reset"></use></svg>
        Timeline
      </button>
      <button type="button" class="opencode-suite-btn" id="ops-btn-models" title="AI providers & model health">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><use href="#opencode-v2-icon-status"></use></svg>
        Models
      </button>
      <button type="button" class="opencode-suite-btn" id="ops-btn-split" title="Multi-session side-by-side monitor">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><use href="#opencode-v2-icon-split"></use></svg>
        Split
      </button>
    `;

    bar.querySelector('#ops-btn-files').addEventListener('click', triggerNativeFiles);
    bar.querySelector('#ops-btn-timeline').addEventListener('click', openTimeline);
    bar.querySelector('#ops-btn-models').addEventListener('click', openModels);
    bar.querySelector('#ops-btn-split').addEventListener('click', toggleSplit);

    header.appendChild(bar);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDialogs();
  });

  const observer = new MutationObserver(() => {
    injectToolbar();
  });

  function start() {
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
      injectToolbar();
      setTimeout(injectToolbar, 500);
      setTimeout(injectToolbar, 1500);
    } else {
      setTimeout(start, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  console.log('[OpenCode WebUI] Pro Suite v4.0 loaded');
})();
