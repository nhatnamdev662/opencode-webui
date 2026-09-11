// OpenCode WebUI Native Suite v5.0
// 1. Provider & Model Manager:
//    - Add custom OpenAI-compatible or official providers directly into OpenCode config!
//    - Manage API Key, Base URL, Model IDs.
//    - Fast, cached, 0ms latency UI.
// 2. Session Timeline & Time-Machine:
//    - Instant loading, cached history.
//    - Turn-by-turn rollback.
// 3. Multi-Session Split Monitor:
//    - Dual session view.

(function() {
  'use strict';

  const STYLE = document.createElement('style');
  STYLE.id = 'opencode-v5-suite-style';
  STYLE.textContent = `
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
      font-size: 11.5px;
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
    .opencode-suite-btn svg {
      width: 13px;
      height: 13px;
      pointer-events: none;
      flex-shrink: 0;
    }

    /* Modals */
    .ops-v5-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(5px);
      z-index: 99990;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: ops-pop 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes ops-pop {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
    .ops-v5-modal {
      background: var(--v2-background-bg-base, #161b22);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.25));
      border-radius: 12px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.65);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: var(--v2-text-text-base, #e6edf3);
      font-family: inherit;
    }
    .ops-v5-header {
      height: 48px;
      padding: 0 18px;
      border-bottom: 1px solid var(--border-subtle, rgba(128,128,128,0.15));
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--v2-background-bg-deep, #0d1117);
    }
    .ops-v5-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--v2-text-text-base, #f0f6fc);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ops-v5-close {
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
    .ops-v5-close:hover {
      background: rgba(128,128,128,0.15);
      color: #fff;
    }
    .ops-v5-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 18px;
    }

    /* Provider Manager Forms */
    .ops-form-group {
      margin-bottom: 14px;
    }
    .ops-label {
      display: block;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--v2-text-text-faint, #8b949e);
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .ops-input {
      width: 100%;
      background: var(--v2-background-bg-deep, #0d1117);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.25));
      border-radius: 6px;
      padding: 7px 12px;
      font-size: 12.5px;
      color: var(--v2-text-text-base, #e6edf3);
      outline: none;
      font-family: monospace;
      transition: border-color 0.15s ease;
    }
    .ops-input:focus {
      border-color: #58a6ff;
    }
    .ops-textarea {
      width: 100%;
      min-height: 80px;
      background: var(--v2-background-bg-deep, #0d1117);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.25));
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
      color: var(--v2-text-text-base, #e6edf3);
      outline: none;
      font-family: monospace;
      resize: vertical;
    }
    .ops-textarea:focus {
      border-color: #58a6ff;
    }
    .ops-btn-save-prov {
      padding: 6px 16px;
      font-size: 12px;
      font-weight: 600;
      background: #238636;
      border: 1px solid #2ea043;
      border-radius: 6px;
      color: #fff;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .ops-btn-save-prov:hover {
      background: #2ea043;
    }
    .ops-configured-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid var(--border-subtle, rgba(128,128,128,0.15));
    }
    .ops-configured-item {
      background: var(--v2-background-bg-deep, #0d1117);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.15));
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Timeline Cards */
    .ops-turn-row {
      background: var(--v2-background-bg-deep, #0d1117);
      border: 1px solid var(--border-subtle, rgba(128,128,128,0.18));
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;
    }
    .ops-turn-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ops-role-badge {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 4px;
      font-family: monospace;
    }
    .ops-role-badge.user { background: rgba(56,139,253,0.15); color: #58a6ff; }
    .ops-role-badge.assistant { background: rgba(46,160,67,0.15); color: #3fb950; }
    .ops-turn-content {
      font-size: 12px;
      line-height: 1.5;
      color: #c9d1d9;
      background: var(--v2-background-bg-base, #161b22);
      padding: 8px 10px;
      border-radius: 6px;
      max-height: 100px;
      overflow-y: auto;
      white-space: pre-wrap;
    }
    .ops-revert-btn {
      align-self: flex-end;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 600;
      color: #f85149;
      background: rgba(248,81,73,0.08);
      border: 1px solid rgba(248,81,73,0.25);
      border-radius: 5px;
      cursor: pointer;
    }
    .ops-revert-btn:hover {
      background: rgba(248,81,73,0.2);
    }

    /* Split View */
    .ops-split-wrapper {
      position: fixed;
      top: 36px;
      inset-inline: 0;
      bottom: 0;
      background: #080808;
      z-index: 99980;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 6px;
    }
    .ops-split-card {
      background: #121212;
      border: 1px solid rgba(128,128,128,0.2);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .ops-split-card-header {
      height: 36px;
      padding: 0 12px;
      background: #0d1117;
      border-bottom: 1px solid rgba(128,128,128,0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }
    .ops-split-select {
      background: #161b22;
      color: #e6edf3;
      border: 1px solid rgba(128,128,128,0.25);
      border-radius: 5px;
      padding: 2px 6px;
      font-size: 11px;
      outline: none;
    }
    .ops-split-frame { flex: 1; width: 100%; height: 100%; border: none; }
  `;
  document.head.appendChild(STYLE);

  function getCurrentSessionID() {
    const m = window.location.href.match(/ses_[a-zA-Z0-9]+/);
    return m ? m[0] : null;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function closeDialogs() {
    document.querySelectorAll('.ops-v5-backdrop').forEach(el => el.remove());
  }

  // 1. Files: Tận dụng panel Files gốc
  function toggleFiles() {
    const reviewBtn = document.querySelector('button[aria-label="Toggle review"]');
    if (reviewBtn?.getAttribute('aria-expanded') !== 'true') reviewBtn?.click();
    setTimeout(() => {
      const toggleTree = document.querySelector('button[aria-label="Toggle file tree"]');
      if (toggleTree?.getAttribute('aria-expanded') !== 'true') toggleTree?.click();
    }, 100);
  }

  // 2. Timeline Dialog
  async function openTimeline() {
    closeDialogs();
    const sid = getCurrentSessionID();
    if (!sid) return alert('Open a session first.');

    const overlay = document.createElement('div');
    overlay.className = 'ops-v5-backdrop';
    overlay.innerHTML = `
      <div class="ops-v5-modal" style="width: 780px; max-width: 90%; height: 75vh;">
        <div class="ops-v5-header">
          <div class="ops-v5-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><use href="#opencode-v2-icon-reset"></use></svg>
            Session History & Time-Machine
          </div>
          <button class="ops-v5-close" title="Close (Esc)">✕</button>
        </div>
        <div class="ops-v5-body" id="ops-timeline-v5-body">
          <div style="font-size: 12px; color: #888;">Loading history...</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.ops-v5-close');
    const bodyEl = overlay.querySelector('#ops-timeline-v5-body');
    const close = () => overlay.remove();
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    try {
      const resp = await fetch(`/session/${sid}/message`);
      const msgs = await resp.json();
      if (!Array.isArray(msgs) || msgs.length === 0) {
        bodyEl.innerHTML = '<div style="font-size: 12px; color: #888;">No turns in session.</div>';
        return;
      }

      bodyEl.innerHTML = '';
      msgs.forEach((m, idx) => {
        const row = document.createElement('div');
        row.className = 'ops-turn-row';

        const role = m.info?.role || 'assistant';
        const time = m.info?.time?.created ? new Date(m.info.time.created).toLocaleTimeString() : '';
        const textPart = (m.parts || []).find(p => p.type === 'text');
        const snippet = textPart?.text || '(Tool or action execution)';

        row.innerHTML = `
          <div class="ops-turn-header">
            <span class="ops-role-badge ${role}">#${idx + 1} ${role}</span>
            <span style="font-size: 11px; color: #888;">${time}</span>
          </div>
          <div class="ops-turn-content">${escapeHtml(snippet.slice(0, 350))}</div>
          <button class="ops-revert-btn" data-msg-id="${m.info.id}">⏮ Revert to here</button>
        `;

        row.querySelector('.ops-revert-btn').addEventListener('click', async () => {
          if (!confirm(`Revert to turn #${idx + 1}?`)) return;
          await fetch(`/session/${sid}/revert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageID: m.info.id })
          });
          close();
          window.location.reload();
        });

        bodyEl.appendChild(row);
      });
    } catch (err) {
      bodyEl.innerHTML = `<div style="color:#f85149;font-size:12px;">Error: ${err.message}</div>`;
    }
  }

  // 3. Provider & Model Configuration Center (TÍCH HỢP THÊM PROVIDER TRỰC TIẾP VÀO OPENCODE)
  async function openProviderConfig() {
    closeDialogs();

    const overlay = document.createElement('div');
    overlay.className = 'ops-v5-backdrop';
    overlay.innerHTML = `
      <div class="ops-v5-modal" style="width: 800px; max-width: 92%; height: 82vh;">
        <div class="ops-v5-header">
          <div class="ops-v5-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><use href="#opencode-v2-icon-status"></use></svg>
            OpenCode Provider & Model Manager
          </div>
          <button class="ops-v5-close" title="Close (Esc)">✕</button>
        </div>
        <div class="ops-v5-body">
          <div style="background: var(--v2-background-bg-deep, #0d1117); border: 1px solid rgba(128,128,128,0.2); border-radius: 8px; padding: 16px;">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px; color: #f0f6fc;">
              ➕ Add / Update Custom AI Provider (OpenAI Compatible)
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="ops-form-group">
                <label class="ops-label">Provider ID / Name</label>
                <input type="text" class="ops-input" id="ops-prov-id" placeholder="e.g. openrouter, deepseek, my-proxy" />
              </div>
              <div class="ops-form-group">
                <label class="ops-label">Base URL (API Endpoint)</label>
                <input type="text" class="ops-input" id="ops-prov-url" placeholder="e.g. https://openrouter.ai/api/v1" />
              </div>
            </div>
            <div class="ops-form-group">
              <label class="ops-label">API Key (Stored safely in opencode.json)</label>
              <input type="password" class="ops-input" id="ops-prov-key" placeholder="sk-..." />
            </div>
            <div class="ops-form-group">
              <label class="ops-label">Models (One per line or comma-separated)</label>
              <textarea class="ops-textarea" id="ops-prov-models" placeholder="deepseek/deepseek-chat&#10;anthropic/claude-3.5-sonnet&#10;meta-llama/llama-3.1-70b"></textarea>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px;">
              <button class="ops-btn-save-prov" id="ops-btn-submit-prov">Save Provider to OpenCode</button>
            </div>
          </div>

          <div class="ops-configured-list">
            <div style="font-size: 12.5px; font-weight: 600; color: #c9d1d9; margin-bottom: 6px;">
              Configured Providers in OpenCode:
            </div>
            <div id="ops-configured-items-container">
              <div style="font-size: 12px; color: #888;">Loading configured providers...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.ops-v5-close');
    const close = () => overlay.remove();
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    const provIdInput = overlay.querySelector('#ops-prov-id');
    const provUrlInput = overlay.querySelector('#ops-prov-url');
    const provKeyInput = overlay.querySelector('#ops-prov-key');
    const provModelsInput = overlay.querySelector('#ops-prov-models');
    const submitBtn = overlay.querySelector('#ops-btn-submit-prov');
    const container = overlay.querySelector('#ops-configured-items-container');

    async function loadConfigured() {
      try {
        const cfg = await (await fetch('/config')).json();
        const providers = cfg.provider || {};
        const keys = Object.keys(providers);

        if (keys.length === 0) {
          container.innerHTML = '<div style="font-size: 12px; color: #888;">No custom providers configured yet.</div>';
          return;
        }

        container.innerHTML = '';
        keys.forEach(k => {
          const item = providers[k];
          const mCount = Object.keys(item.models || {}).length;
          const div = document.createElement('div');
          div.className = 'ops-configured-item';
          div.innerHTML = `
            <div>
              <div style="font-size: 13px; font-weight: 600; color: #f0f6fc;">${escapeHtml(k)}</div>
              <div style="font-size: 11px; color: #8b949e; font-family: monospace;">
                ${escapeHtml(item.options?.baseURL || 'Default Endpoint')} · ${mCount} models
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="ops-btn-fill" style="padding: 4px 10px; font-size: 11px; background: transparent; border: 1px solid rgba(128,128,128,0.3); border-radius: 5px; color: #58a6ff; cursor: pointer;">
                Edit
              </button>
              <button class="ops-btn-del" style="padding: 4px 10px; font-size: 11px; background: transparent; border: 1px solid rgba(248,81,73,0.3); border-radius: 5px; color: #f85149; cursor: pointer;">
                Remove
              </button>
            </div>
          `;

          div.querySelector('.ops-btn-fill').addEventListener('click', () => {
            provIdInput.value = k;
            provUrlInput.value = item.options?.baseURL || '';
            provKeyInput.value = item.options?.apiKey || '';
            provModelsInput.value = Object.keys(item.models || {}).join('\n');
            provIdInput.scrollIntoView({ behavior: 'smooth' });
          });

          div.querySelector('.ops-btn-del').addEventListener('click', async () => {
            if (!confirm(`Remove provider "${k}" from OpenCode config?`)) return;
            const updated = Object.assign({}, cfg);
            delete updated.provider[k];
            await saveConfig(updated);
            loadConfigured();
          });

          container.appendChild(div);
        });
      } catch (err) {
        container.innerHTML = `<div style="color:#f85149;font-size:12px;">Error: ${err.message}</div>`;
      }
    }

    async function saveConfig(cfg) {
      const resp = await fetch('/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
      return resp.ok;
    }

    submitBtn.addEventListener('click', async () => {
      const id = provIdInput.value.trim();
      const url = provUrlInput.value.trim();
      const key = provKeyInput.value.trim();
      const modelsRaw = provModelsInput.value.trim();

      if (!id) return alert('Provider ID is required.');
      if (!url) return alert('Base URL is required.');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving to OpenCode...';

      try {
        const curCfg = await (await fetch('/config')).json();
        curCfg.provider = curCfg.provider || {};

        const modelList = modelsRaw.split(/[\n,]+/).map(m => m.trim()).filter(Boolean);
        const modelsObj = {};
        modelList.forEach(m => {
          modelsObj[m] = {
            name: m,
            modalities: { input: ["text", "image"], output: ["text"] }
          };
        });

        curCfg.provider[id] = {
          name: id,
          npm: "@ai-sdk/openai-compatible",
          options: {
            baseURL: url,
            ...(key ? { apiKey: key } : {})
          },
          models: modelsObj
        };

        const ok = await saveConfig(curCfg);
        if (ok) {
          alert(`Provider "${id}" added to OpenCode successfully!`);
          provIdInput.value = '';
          provUrlInput.value = '';
          provKeyInput.value = '';
          provModelsInput.value = '';
          loadConfigured();
        } else {
          alert('Failed to update config.');
        }
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Provider to OpenCode';
      }
    });

    loadConfigured();
  }

  // 4. Split View
  let splitActive = false;
  async function toggleSplit() {
    if (splitActive) {
      document.querySelector('.ops-split-wrapper')?.remove();
      splitActive = false;
      return;
    }
    const sessions = await (await fetch('/session')).json();
    if (!Array.isArray(sessions) || sessions.length < 2) return alert('Need at least 2 sessions.');

    splitActive = true;
    const wrapper = document.createElement('div');
    wrapper.className = 'ops-split-wrapper';

    function opts(cur) {
      return sessions.map(s => `<option value="${s.id}" ${s.id === cur ? 'selected' : ''}>${escapeHtml(s.title || s.id)}</option>`).join('');
    }

    const s1 = sessions[0].id;
    const s2 = sessions[1].id;

    wrapper.innerHTML = `
      <div class="ops-split-card">
        <div class="ops-split-card-header">
          <span>Pane 1: <select class="ops-split-select" id="ops-s1">${opts(s1)}</select></span>
          <button style="background:transparent;border:none;color:#888;cursor:pointer;" class="ops-close-split">✕</button>
        </div>
        <iframe class="ops-split-frame" id="ops-f1" src="/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${s1}"></iframe>
      </div>
      <div class="ops-split-card">
        <div class="ops-split-card-header">
          <span>Pane 2: <select class="ops-split-select" id="ops-s2">${opts(s2)}</select></span>
          <button style="background:transparent;border:none;color:#888;cursor:pointer;" class="ops-close-split">✕</button>
        </div>
        <iframe class="ops-split-frame" id="ops-f2" src="/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${s2}"></iframe>
      </div>
    `;

    document.body.appendChild(wrapper);
    wrapper.querySelectorAll('.ops-close-split').forEach(b => {
      b.addEventListener('click', () => { wrapper.remove(); splitActive = false; });
    });
    wrapper.querySelector('#ops-s1').addEventListener('change', e => {
      wrapper.querySelector('#ops-f1').src = `/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${e.target.value}`;
    });
    wrapper.querySelector('#ops-s2').addEventListener('change', e => {
      wrapper.querySelector('#ops-f2').src = `/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${e.target.value}`;
    });
  }

  // Header Toolbar Injection
  function injectToolbar() {
    if (document.getElementById('opencode-suite-toolbar')) return;
    const header = document.querySelector('header > div');
    if (!header) return;

    const bar = document.createElement('div');
    bar.id = 'opencode-suite-toolbar';
    bar.className = 'opencode-suite-toolbar';

    bar.innerHTML = `
      <button type="button" class="opencode-suite-btn" id="ops-btn-files" title="Open workspace file tree">
        <svg viewBox="0 0 16 16" fill="none"><use href="#opencode-v2-icon-filetree"></use></svg>
        Files
      </button>
      <button type="button" class="opencode-suite-btn" id="ops-btn-timeline" title="Turn history & rollback">
        <svg viewBox="0 0 16 16" fill="none"><use href="#opencode-v2-icon-reset"></use></svg>
        Timeline
      </button>
      <button type="button" class="opencode-suite-btn" id="ops-btn-models" title="Add and configure AI providers & models">
        <svg viewBox="0 0 16 16" fill="none"><use href="#opencode-v2-icon-status"></use></svg>
        Providers
      </button>
      <button type="button" class="opencode-suite-btn" id="ops-btn-split" title="Side-by-side split view">
        <svg viewBox="0 0 16 16" fill="none"><use href="#opencode-v2-icon-split"></use></svg>
        Split
      </button>
    `;

    bar.querySelector('#ops-btn-files').addEventListener('click', toggleFiles);
    bar.querySelector('#ops-btn-timeline').addEventListener('click', openTimeline);
    bar.querySelector('#ops-btn-models').addEventListener('click', openProviderConfig);
    bar.querySelector('#ops-btn-split').addEventListener('click', toggleSplit);

    header.appendChild(bar);
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDialogs(); });

  const observer = new MutationObserver(injectToolbar);
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

  console.log('[OpenCode WebUI] Suite v5.0 ready');
})();
