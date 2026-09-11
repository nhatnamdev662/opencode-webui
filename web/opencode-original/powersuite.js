// OpenCode WebUI Power Suite v1.0
// Features:
// 1. File Explorer & Code Viewer/Editor (Mini IDE)
// 2. Git Timeline & Session Rollback (Time-Machine)
// 3. Model & Provider Health Dashboard & Fast Switcher
// 4. Multi-Session Split Monitor
// Integrates cleanly with OpenCode Core REST APIs without modifying original bundle.

(function() {
  'use strict';

  // Inject Styles
  const STYLE = document.createElement('style');
  STYLE.id = 'opencode-power-suite-style';
  STYLE.textContent = `
    /* Header Tools */
    .ops-header-bar {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
      margin-right: 8px;
      z-index: 40;
      flex-shrink: 0;
    }
    .ops-tool-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 24px;
      padding: 0 9px;
      font-size: 11.5px;
      font-weight: 500;
      font-family: inherit;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .ops-tool-btn svg {
      width: 13px;
      height: 13px;
      pointer-events: none;
      flex-shrink: 0;
    }
    .ops-btn-files {
      background: rgba(56,139,253,0.12);
      color: #58a6ff;
      border-color: rgba(56,139,253,0.25);
    }
    .ops-btn-files:hover, .ops-btn-files.active {
      background: rgba(56,139,253,0.22);
      border-color: rgba(56,139,253,0.5);
      color: #79c0ff;
    }
    .ops-btn-timeline {
      background: rgba(46,160,67,0.12);
      color: #3fb950;
      border-color: rgba(46,160,67,0.25);
    }
    .ops-btn-timeline:hover, .ops-btn-timeline.active {
      background: rgba(46,160,67,0.22);
      border-color: rgba(46,160,67,0.5);
      color: #56d364;
    }
    .ops-btn-models {
      background: rgba(163,113,247,0.12);
      color: #bc8cff;
      border-color: rgba(163,113,247,0.25);
    }
    .ops-btn-models:hover, .ops-btn-models.active {
      background: rgba(163,113,247,0.22);
      border-color: rgba(163,113,247,0.5);
      color: #d2a8ff;
    }
    .ops-btn-split {
      background: rgba(210,153,34,0.12);
      color: #d29922;
      border-color: rgba(210,153,34,0.25);
    }
    .ops-btn-split:hover, .ops-btn-split.active {
      background: rgba(210,153,34,0.22);
      border-color: rgba(210,153,34,0.5);
      color: #e3b341;
    }

    /* Modal / Drawer Base */
    .ops-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
      z-index: 99990;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: ops-fade-in 0.15s ease;
    }
    @keyframes ops-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .ops-modal-window {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 48px rgba(0,0,0,0.6);
      overflow: hidden;
      color: #e6edf3;
    }
    .ops-modal-header {
      padding: 12px 18px;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #0d1117;
      user-select: none;
    }
    .ops-modal-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 600;
      font-family: inherit;
    }
    .ops-modal-close {
      background: transparent;
      border: none;
      color: #8b949e;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.12s ease;
    }
    .ops-modal-close:hover {
      color: #f0f6fc;
      background: rgba(139,148,158,0.15);
    }
    .ops-modal-body {
      flex: 1;
      overflow: auto;
      display: flex;
    }

    /* File Explorer Specific */
    .ops-files-sidebar {
      width: 260px;
      border-right: 1px solid #30363d;
      background: #0d1117;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .ops-files-search-box {
      padding: 8px 12px;
      border-bottom: 1px solid #21262d;
    }
    .ops-files-search {
      width: 100%;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 11.5px;
      color: #e6edf3;
      outline: none;
    }
    .ops-files-tree {
      flex: 1;
      overflow-y: auto;
      padding: 6px;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 12px;
    }
    .ops-tree-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      color: #8b949e;
      transition: background 0.1s ease;
    }
    .ops-tree-item:hover {
      background: rgba(139,148,158,0.12);
      color: #f0f6fc;
    }
    .ops-tree-item.active {
      background: rgba(56,139,253,0.18);
      color: #58a6ff;
      font-weight: 500;
    }
    .ops-tree-item.is-dir {
      font-weight: 600;
      color: #c9d1d9;
    }
    .ops-files-viewer {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #0d1117;
      overflow: hidden;
    }
    .ops-viewer-header {
      padding: 8px 16px;
      border-bottom: 1px solid #21262d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #161b22;
      font-size: 12px;
      font-family: monospace;
      color: #8b949e;
    }
    .ops-viewer-content {
      flex: 1;
      margin: 0;
      padding: 16px;
      background: #0d1117;
      color: #e6edf3;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 12.5px;
      line-height: 1.6;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* Timeline Specific */
    .ops-timeline-list {
      flex: 1;
      padding: 18px 24px;
      overflow-y: auto;
    }
    .ops-timeline-item {
      position: relative;
      padding-left: 28px;
      padding-bottom: 24px;
      border-left: 2px solid #30363d;
    }
    .ops-timeline-item:last-child {
      border-left-color: transparent;
      padding-bottom: 0;
    }
    .ops-timeline-dot {
      position: absolute;
      left: -7px;
      top: 0;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #238636;
      border: 2px solid #161b22;
    }
    .ops-timeline-dot.user {
      background: #1f6feb;
    }
    .ops-timeline-card {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .ops-timeline-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .ops-timeline-role {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-family: monospace;
    }
    .ops-timeline-role.assistant { color: #3fb950; }
    .ops-timeline-role.user { color: #58a6ff; }
    .ops-timeline-time {
      font-size: 11px;
      color: #6e7681;
      font-family: monospace;
    }
    .ops-timeline-summary {
      font-size: 12.5px;
      color: #c9d1d9;
      line-height: 1.5;
    }
    .ops-timeline-actions {
      margin-top: 10px;
      display: flex;
      gap: 8px;
    }
    .ops-rollback-btn {
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 500;
      font-family: monospace;
      color: #f85149;
      background: rgba(248,81,73,0.1);
      border: 1px solid rgba(248,81,73,0.3);
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .ops-rollback-btn:hover {
      background: rgba(248,81,73,0.22);
      border-color: #f85149;
    }

    /* Models Dashboard Specific */
    .ops-models-panel {
      flex: 1;
      padding: 16px 20px;
      overflow-y: auto;
    }
    .ops-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
    .ops-provider-card {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ops-provider-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ops-provider-name {
      font-size: 13px;
      font-weight: 600;
      color: #f0f6fc;
    }
    .ops-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      font-family: monospace;
    }
    .ops-badge.connected {
      background: rgba(46,160,67,0.18);
      color: #3fb950;
      border: 1px solid rgba(46,160,67,0.4);
    }
    .ops-badge.unconfigured {
      background: rgba(139,148,158,0.1);
      color: #8b949e;
      border: 1px solid #30363d;
    }
    .ops-provider-models {
      font-size: 11.5px;
      color: #8b949e;
      line-height: 1.4;
    }
    .ops-latency-badge {
      font-size: 10.5px;
      font-family: monospace;
      color: #3fb950;
    }

    /* Split View Specific */
    .ops-split-overlay {
      position: fixed;
      top: 36px; left: 0; right: 0; bottom: 0;
      background: #080808;
      z-index: 99980;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr;
      gap: 4px;
      padding: 4px;
    }
    .ops-split-pane {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .ops-split-header {
      padding: 6px 12px;
      background: #0d1117;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 500;
    }
    .ops-split-select {
      background: #161b22;
      color: #e6edf3;
      border: 1px solid #30363d;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      outline: none;
    }
    .ops-split-frame {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
    }
  `;
  document.head.appendChild(STYLE);

  // SVG Icons
  const ICONS = {
    folder: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2.5A1.75 1.75 0 000 4.25v7.5C0 12.716.784 13.5 1.75 13.5h12.5A1.75 1.75 0 0016 11.75v-6a1.75 1.75 0 00-1.75-1.75H7.879a.25.25 0 01-.177-.073l-.823-.824A1.75 1.75 0 005.64 2.5H1.75z"/></svg>',
    file: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0113.25 16h-9.5A1.75 1.75 0 012 14.25V1.75zm1.75-.25a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 00.25-.25V4.5h-2.75A1.75 1.75 0 019 2.75V1.5H3.75z"/></svg>',
    timeline: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm.75 4.75v3.5a.75.75 0 01-.22.53l-2.25 2.25a.75.75 0 11-1.06-1.06L7.25 8V4.75a.75.75 0 011.5 0z"/></svg>',
    model: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 11.972l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 5.999a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>',
    split: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2.5h5.5v11h-5.5a.25.25 0 01-.25-.25v-10.5c0-.138.112-.25.25-.25zm7 11v-11h5.5c.138 0 .25.112.25.25v10.5a.25.25 0 01-.25.25h-5.5zM0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0114.25 16H1.75A1.75 1.75 0 010 14.25V3.75z"/></svg>'
  };

  function getCurrentSessionID() {
    const urlMatch = window.location.href.match(/ses_[a-zA-Z0-9]+/);
    return urlMatch ? urlMatch[0] : null;
  }

  async function getActiveDirectory() {
    const sid = getCurrentSessionID();
    if (sid) {
      try {
        const resp = await fetch('/session/' + sid);
        if (resp.ok) {
          const data = await resp.json();
          if (data.directory) return data.directory;
        }
      } catch {}
    }
    try {
      const resp = await fetch('/path');
      if (resp.ok) {
        const p = await resp.json();
        return p.directory || p.home || '.';
      }
    } catch {}
    return '.';
  }

  // ==========================================
  // 1. FILE EXPLORER & CODE VIEWER (Mini IDE)
  // ==========================================
  async function openFileExplorer() {
    closeActiveModal();

    const currentDir = await getActiveDirectory();

    const overlay = document.createElement('div');
    overlay.className = 'ops-modal-overlay';
    overlay.innerHTML = `
      <div class="ops-modal-window" style="width: 92%; max-width: 1080px; height: 85vh;">
        <div class="ops-modal-header">
          <div class="ops-modal-title">
            ${ICONS.folder} File Explorer & Code Viewer
            <span style="font-size: 11px; font-weight: 400; color: #8b949e; font-family: monospace;">(${escapeHtml(currentDir)})</span>
          </div>
          <button class="ops-modal-close" title="Close (Esc)">✕</button>
        </div>
        <div class="ops-modal-body">
          <div class="ops-files-sidebar">
            <div class="ops-files-search-box">
              <input type="text" class="ops-files-search" placeholder="Search file name..." />
            </div>
            <div class="ops-files-tree">
              <div style="padding: 12px; color: #6e7681; font-size: 11px;">Loading files...</div>
            </div>
          </div>
          <div class="ops-files-viewer">
            <div class="ops-viewer-header">
              <span id="ops-viewer-filepath">Select a file on the left</span>
              <span id="ops-viewer-meta"></span>
            </div>
            <pre class="ops-viewer-content" id="ops-viewer-code">// Select a file to view code</pre>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.ops-modal-close');
    const searchInput = overlay.querySelector('.ops-files-search');
    const treeContainer = overlay.querySelector('.ops-files-tree');
    const filepathEl = overlay.querySelector('#ops-viewer-filepath');
    const metaEl = overlay.querySelector('#ops-viewer-meta');
    const codeEl = overlay.querySelector('#ops-viewer-code');

    const close = () => overlay.remove();
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    let allFiles = [];

    async function loadDirectory(subpath = '.') {
      treeContainer.innerHTML = '<div style="padding: 12px; color: #6e7681; font-size: 11px;">Scanning directory...</div>';
      try {
        const url = `/file?directory=${encodeURIComponent(currentDir)}&path=${encodeURIComponent(subpath)}`;
        const resp = await fetch(url);
        const files = await resp.json();

        if (Array.isArray(files)) {
          allFiles = files;
          renderTree(files);
        } else {
          treeContainer.innerHTML = `<div style="padding: 12px; color: #f85149; font-size: 11px;">Failed to load files</div>`;
        }
      } catch (err) {
        treeContainer.innerHTML = `<div style="padding: 12px; color: #f85149; font-size: 11px;">Error: ${err.message}</div>`;
      }
    }

    function renderTree(files) {
      treeContainer.innerHTML = '';
      if (files.length === 0) {
        treeContainer.innerHTML = '<div style="padding: 12px; color: #6e7681; font-size: 11px;">No files found</div>';
        return;
      }

      // Directories first, then files
      const sorted = [...files].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });

      sorted.forEach(file => {
        const item = document.createElement('div');
        item.className = 'ops-tree-item' + (file.type === 'directory' ? ' is-dir' : '');
        item.innerHTML = `
          ${file.type === 'directory' ? ICONS.folder : ICONS.file}
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(file.name)}</span>
        `;

        item.addEventListener('click', () => {
          overlay.querySelectorAll('.ops-tree-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');

          if (file.type === 'directory') {
            loadDirectory(file.path);
          } else {
            loadFileContent(file.path, file.name);
          }
        });

        treeContainer.appendChild(item);
      });
    }

    async function loadFileContent(filePath, fileName) {
      filepathEl.textContent = `${fileName} (${filePath})`;
      metaEl.textContent = 'Loading...';
      codeEl.textContent = 'Loading file contents...';

      try {
        const url = `/file/content?directory=${encodeURIComponent(currentDir)}&path=${encodeURIComponent(filePath)}`;
        const resp = await fetch(url);
        const data = await resp.json();

        if (data && typeof data.content === 'string') {
          codeEl.textContent = data.content;
          metaEl.textContent = `${data.content.length.toLocaleString()} chars | ${data.content.split('\n').length} lines`;
        } else {
          codeEl.textContent = '// Binary or unsupported file type';
          metaEl.textContent = 'Binary';
        }
      } catch (err) {
        codeEl.textContent = `// Error reading file: ${err.message}`;
        metaEl.textContent = 'Error';
      }
    }

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      if (!q) {
        renderTree(allFiles);
      } else {
        renderTree(allFiles.filter(f => f.name.toLowerCase().includes(q)));
      }
    });

    loadDirectory('.');
  }

  // ==========================================
  // 2. GIT TIMELINE & SESSION ROLLBACK (Time-Machine)
  // ==========================================
  async function openTimeline() {
    closeActiveModal();
    const sid = getCurrentSessionID();
    if (!sid) {
      alert('Please open a session first to view its timeline.');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'ops-modal-overlay';
    overlay.innerHTML = `
      <div class="ops-modal-window" style="width: 85%; max-width: 820px; height: 80vh;">
        <div class="ops-modal-header">
          <div class="ops-modal-title">
            ${ICONS.timeline} Session Timeline & Time-Machine
            <span style="font-size: 11px; font-weight: 400; color: #8b949e; font-family: monospace;">(${sid})</span>
          </div>
          <button class="ops-modal-close" title="Close (Esc)">✕</button>
        </div>
        <div class="ops-modal-body">
          <div class="ops-timeline-list" id="ops-timeline-container">
            <div style="padding: 16px; color: #6e7681; font-size: 12px;">Loading turn history...</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.ops-modal-close');
    const container = overlay.querySelector('#ops-timeline-container');
    const close = () => overlay.remove();
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    try {
      const resp = await fetch(`/session/${sid}/message`);
      const msgs = await resp.json();

      if (!Array.isArray(msgs) || msgs.length === 0) {
        container.innerHTML = '<div style="padding: 16px; color: #6e7681; font-size: 12px;">No messages in this session yet.</div>';
        return;
      }

      container.innerHTML = '';
      msgs.forEach((msg, idx) => {
        const isAssistant = msg.info.role === 'assistant';
        const item = document.createElement('div');
        item.className = 'ops-timeline-item';

        const textPart = (msg.parts || []).find(p => p.type === 'text');
        const snippet = textPart?.text ? textPart.text.slice(0, 180).trim() + (textPart.text.length > 180 ? '...' : '') : '(Tool execution or reasoning turn)';
        const timeStr = msg.info.time?.created ? new Date(msg.info.time.created).toLocaleTimeString() : '';

        item.innerHTML = `
          <div class="ops-timeline-dot ${msg.info.role}"></div>
          <div class="ops-timeline-card">
            <div class="ops-timeline-title-row">
              <span class="ops-timeline-role ${msg.info.role}">#${idx + 1} ${msg.info.role}</span>
              <span class="ops-timeline-time">${timeStr}</span>
            </div>
            <div class="ops-timeline-summary">${escapeHtml(snippet)}</div>
            <div class="ops-timeline-actions">
              <button class="ops-rollback-btn" data-msg-id="${msg.info.id}">
                ⏮ Revert Session to here
              </button>
            </div>
          </div>
        `;

        const rollbackBtn = item.querySelector('.ops-rollback-btn');
        rollbackBtn.addEventListener('click', async () => {
          if (!confirm(`Are you sure you want to revert session to message #${idx + 1}? Subsequent actions will be rolled back.`)) {
            return;
          }
          rollbackBtn.disabled = true;
          rollbackBtn.textContent = 'Reverting...';
          try {
            const r = await fetch(`/session/${sid}/revert`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messageID: msg.info.id })
            });
            if (r.ok) {
              alert('Reverted successfully! Refreshing session...');
              close();
              window.location.reload();
            } else {
              const err = await r.text();
              alert('Failed to revert: ' + err);
              rollbackBtn.disabled = false;
              rollbackBtn.textContent = '⏮ Revert Session to here';
            }
          } catch (e) {
            alert('Network error: ' + e.message);
            rollbackBtn.disabled = false;
            rollbackBtn.textContent = '⏮ Revert Session to here';
          }
        });

        container.appendChild(item);
      });
    } catch (err) {
      container.innerHTML = `<div style="padding: 16px; color: #f85149; font-size: 12px;">Failed to load timeline: ${err.message}</div>`;
    }
  }

  // ==========================================
  // 3. MODELS & PROVIDERS HEALTH DASHBOARD
  // ==========================================
  async function openModelsDashboard() {
    closeActiveModal();

    const overlay = document.createElement('div');
    overlay.className = 'ops-modal-overlay';
    overlay.innerHTML = `
      <div class="ops-modal-window" style="width: 88%; max-width: 960px; height: 82vh;">
        <div class="ops-modal-header">
          <div class="ops-modal-title">
            ${ICONS.model} AI Models & Providers Dashboard
          </div>
          <button class="ops-modal-close" title="Close (Esc)">✕</button>
        </div>
        <div class="ops-modal-body">
          <div class="ops-models-panel">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <span style="font-size: 12px; color: #8b949e;">Configured providers & models registered in OpenCode Core</span>
              <button id="ops-ping-all-btn" style="padding: 4px 10px; font-size: 11px; font-weight: 600; background: #238636; color: #fff; border: 1px solid #2ea043; border-radius: 6px; cursor: pointer;">
                ⚡ Test API Latency
              </button>
            </div>
            <div class="ops-grid" id="ops-providers-grid">
              <div style="padding: 16px; color: #6e7681; font-size: 12px;">Loading providers...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.ops-modal-close');
    const grid = overlay.querySelector('#ops-providers-grid');
    const pingBtn = overlay.querySelector('#ops-ping-all-btn');
    const close = () => overlay.remove();
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    try {
      const resp = await fetch('/provider');
      const data = await resp.json();
      const connected = new Set(data.connected || []);
      const allProviders = data.all || [];

      // Sort connected providers to top
      const sorted = [...allProviders].sort((a, b) => {
        const aConn = connected.has(a.id) ? 1 : 0;
        const bConn = connected.has(b.id) ? 1 : 0;
        return bConn - aConn;
      });

      grid.innerHTML = '';
      sorted.slice(0, 48).forEach(prov => {
        const isConn = connected.has(prov.id);
        const card = document.createElement('div');
        card.className = 'ops-provider-card';
        card.setAttribute('data-provider-id', prov.id);

        const modelsList = Object.keys(prov.models || {});
        const sampleModels = modelsList.slice(0, 3).join(', ') + (modelsList.length > 3 ? ` +${modelsList.length - 3} more` : '');

        card.innerHTML = `
          <div class="ops-provider-header">
            <span class="ops-provider-name">${escapeHtml(prov.name || prov.id)}</span>
            <span class="ops-badge ${isConn ? 'connected' : 'unconfigured'}">
              ${isConn ? '● Connected' : 'Unconfigured'}
            </span>
          </div>
          <div class="ops-provider-models">
            ${modelsList.length > 0 ? escapeHtml(sampleModels) : 'No models registered'}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
            <span class="ops-latency-badge" id="latency-${prov.id}"></span>
            <span style="font-size: 10px; color: #6e7681; font-family: monospace;">ID: ${prov.id}</span>
          </div>
        `;
        grid.appendChild(card);
      });

      pingBtn.addEventListener('click', async () => {
        pingBtn.disabled = true;
        pingBtn.textContent = 'Pinging...';

        for (const provId of connected) {
          const badge = grid.querySelector(`#latency-${provId}`);
          if (badge) badge.textContent = 'pinging...';

          const start = performance.now();
          try {
            await fetch(`/provider/${provId}`);
            const duration = Math.round(performance.now() - start);
            if (badge) badge.textContent = `${duration}ms`;
          } catch {
            if (badge) badge.textContent = 'offline';
          }
        }
        pingBtn.disabled = false;
        pingBtn.textContent = '⚡ Test API Latency';
      });

    } catch (err) {
      grid.innerHTML = `<div style="padding: 16px; color: #f85149; font-size: 12px;">Failed to load providers: ${err.message}</div>`;
    }
  }

  // ==========================================
  // 4. MULTI-SESSION SPLIT MONITOR
  // ==========================================
  let isSplitActive = false;

  async function toggleSplitView() {
    if (isSplitActive) {
      const existing = document.querySelector('.ops-split-overlay');
      if (existing) existing.remove();
      isSplitActive = false;
      return;
    }

    const sessionsResp = await fetch('/session');
    const sessions = await sessionsResp.json();
    if (!Array.isArray(sessions) || sessions.length < 2) {
      alert('Need at least 2 sessions to use Split View.');
      return;
    }

    isSplitActive = true;
    const splitOverlay = document.createElement('div');
    splitOverlay.className = 'ops-split-overlay';

    function buildOptions(selectedId) {
      return sessions.map(s => `
        <option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>
          ${escapeHtml(s.title || s.slug || s.id)} (${s.id.slice(0, 8)})
        </option>
      `).join('');
    }

    const s1 = sessions[0].id;
    const s2 = sessions[1].id;

    splitOverlay.innerHTML = `
      <div class="ops-split-pane">
        <div class="ops-split-header">
          <span>Session A: <select class="ops-split-select" id="ops-split-sel-1">${buildOptions(s1)}</select></span>
          <button style="background:transparent;border:none;color:#8b949e;cursor:pointer;" class="ops-split-close-btn">✕ Close Split</button>
        </div>
        <iframe class="ops-split-frame" id="ops-frame-1" src="/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${s1}"></iframe>
      </div>
      <div class="ops-split-pane">
        <div class="ops-split-header">
          <span>Session B: <select class="ops-split-select" id="ops-split-sel-2">${buildOptions(s2)}</select></span>
          <button style="background:transparent;border:none;color:#8b949e;cursor:pointer;" class="ops-split-close-btn">✕ Close Split</button>
        </div>
        <iframe class="ops-split-frame" id="ops-frame-2" src="/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${s2}"></iframe>
      </div>
    `;

    document.body.appendChild(splitOverlay);

    splitOverlay.querySelectorAll('.ops-split-close-btn').forEach(b => {
      b.addEventListener('click', () => {
        splitOverlay.remove();
        isSplitActive = false;
      });
    });

    const sel1 = splitOverlay.querySelector('#ops-split-sel-1');
    const sel2 = splitOverlay.querySelector('#ops-split-sel-2');
    const f1 = splitOverlay.querySelector('#ops-frame-1');
    const f2 = splitOverlay.querySelector('#ops-frame-2');

    sel1.addEventListener('change', () => {
      f1.src = `/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${sel1.value}`;
    });
    sel2.addEventListener('change', () => {
      f2.src = `/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${sel2.value}`;
    });
  }

  function closeActiveModal() {
    document.querySelectorAll('.ops-modal-overlay').forEach(o => o.remove());
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Inject Header Buttons Bar into OpenCode Header
  function injectHeaderBar() {
    if (document.getElementById('ops-header-bar')) return;

    const header = document.querySelector('header > div');
    if (!header) return;

    const bar = document.createElement('div');
    bar.id = 'ops-header-bar';
    bar.className = 'ops-header-bar';

    bar.innerHTML = `
      <button class="ops-tool-btn ops-btn-files" title="Explore workspace files & view code">
        ${ICONS.folder} Files
      </button>
      <button class="ops-tool-btn ops-btn-timeline" title="View turn history & rollback">
        ${ICONS.timeline} Timeline
      </button>
      <button class="ops-tool-btn ops-btn-models" title="AI models health & providers">
        ${ICONS.model} Models
      </button>
      <button class="ops-tool-btn ops-btn-split" title="Multi-session side-by-side view">
        ${ICONS.split} Split
      </button>
    `;

    bar.querySelector('.ops-btn-files').addEventListener('click', openFileExplorer);
    bar.querySelector('.ops-btn-timeline').addEventListener('click', openTimeline);
    bar.querySelector('.ops-btn-models').addEventListener('click', openModelsDashboard);
    bar.querySelector('.ops-btn-split').addEventListener('click', toggleSplitView);

    header.appendChild(bar);
  }

  // Keyboard shortcut listener: Esc closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeActiveModal();
    }
  });

  // Observe Header Changes
  const observer = new MutationObserver(() => {
    injectHeaderBar();
  });

  function start() {
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
      injectHeaderBar();
      setTimeout(injectHeaderBar, 500);
      setTimeout(injectHeaderBar, 1500);
    } else {
      setTimeout(start, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  console.log('[OpenCode WebUI] Power Suite v1.0 loaded');
})();
