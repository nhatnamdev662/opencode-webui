// OpenCode WebUI Power Suite v6.1
// - Removed redundant Timeline feature
// - Fixed floating tooltips via document.body Portal (cannot be clipped by header overflow)
// - Table-based code viewer with sticky line numbers & syntax spacing
// - Ultra-compact header pill with Files (Alt+F) & Split Screen (Alt+S)

(function() {
  'use strict';

  // Prevent multiple executions
  if (window.__OPENCODE_POWERSUITE_LOADED__) return;
  window.__OPENCODE_POWERSUITE_LOADED__ = true;

  const ICONS = {
    folder: `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M1 2.75C1 1.784 1.784 1 2.75 1h3.086c.464 0 .91.184 1.238.513l1.414 1.414c.328.329.774.513 1.238.513H13.25c.966 0 1.75.784 1.75 1.75v7.06A1.75 1.75 0 0113.25 14H2.75A1.75 1.75 0 011 12.25V2.75z"/></svg>`,
    folderOpen: `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M.513 5.676A1.75 1.75 0 012.17 4.5h11.66c.749 0 1.41.479 1.657 1.176l1.5 4.25A1.75 1.75 0 0115.33 12.25H2.67a1.75 1.75 0 01-1.657-2.324l1.5-4.25zM1 3.25C1 2.56.56 2 2.25 2h2.836c.331 0 .65.132.884.366l.764.764c.469.469 1.105.732 1.768.732H13.75c.69 0 1.25.56 1.25 1.25v.138A2.75 2.75 0 0013.83 5H2.17A2.75 2.75 0 00.5 7.022V3.25z"/></svg>`,
    file: `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0113.25 16H3.75A1.75 1.75 0 012 14.25V1.75zm10.25 3.5H9.75A1.75 1.75 0 018 3.5V1.5H3.75a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 00.25-.25V5.25z"/></svg>`,
    split: `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0114.25 15H1.75A1.75 1.75 0 010 13.25V2.75zm1.5.25v10c0 .138.112.25.25.25h5.5V3H1.75a.25.25 0 00-.25.25zm7.25 10.25h5.5a.25.25 0 00.25-.25V3a.25.25 0 00-.25-.25h-5.5v10.5z"/></svg>`,
    diff: `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M8.75 1.75a.75.75 0 00-1.5 0v3.5H3.75a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z"/></svg>`,
    copy: `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/></svg>`,
    chevronRight: `<svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><path fill-rule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"/></svg>`,
    chevronDown: `<svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><path fill-rule="evenodd" d="M3.22 6.22a.75.75 0 011.06 0L8 9.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 010-1.06z"/></svg>`,
    search: `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path fill-rule="evenodd" d="M11.5 7a4.499 4.499 0 11-8.998 0A4.499 4.499 0 0111.5 7zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z"/></svg>`
  };

  const STYLE = document.createElement('style');
  STYLE.id = 'opencode-powersuite-v61-style';
  STYLE.textContent = `
    /* Ultra-Compact Toolbar Pill */
    .ops-toolbar-pill {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      margin-left: 6px;
      margin-right: 4px;
      padding: 2px;
      height: 26px;
      box-sizing: border-box;
      background: var(--v2-background-bg-base, #161b22);
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      border-radius: 7px;
      z-index: 30;
      flex-shrink: 0;
      user-select: none;
    }
    .ops-pill-btn {
      height: 22px;
      min-width: 26px;
      padding: 0 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      background: transparent;
      border: none;
      border-radius: 5px;
      color: var(--v2-text-text-faint, #8f8f8f);
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 11.5px;
      font-weight: 500;
      font-family: inherit;
      line-height: 1;
    }
    .ops-pill-btn:hover {
      background: var(--v2-overlay-simple-overlay-hover, rgba(128, 128, 128, 0.16));
      color: var(--v2-text-text-base, #f0f6fc);
    }
    .ops-pill-btn.active {
      background: rgba(56, 139, 253, 0.18);
      color: #58a6ff;
    }
    .ops-pill-btn svg {
      flex-shrink: 0;
      pointer-events: none;
    }

    /* Portal Floating Tooltip (attached to document.body, cannot be clipped) */
    .ops-portal-tooltip {
      position: fixed;
      padding: 6px 10px;
      border-radius: 7px;
      font-size: 11px;
      font-family: inherit;
      background: #1c2128;
      color: #f0f6fc;
      border: 1px solid #30363d;
      box-shadow: 0 8px 24px rgba(0,0,0,0.55);
      pointer-events: none;
      z-index: 9999999;
      animation: ops-tooltip-pop 0.12s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-width: 240px;
    }
    @keyframes ops-tooltip-pop {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .ops-tooltip-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: #ffffff;
    }
    .ops-tooltip-kbd {
      padding: 1px 4px;
      font-size: 9.5px;
      font-family: monospace;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 3px;
      color: #58a6ff;
    }
    .ops-tooltip-desc {
      font-size: 10.5px;
      color: #8b949e;
      line-height: 1.35;
    }

    /* Modal Backdrop & Shared Window */
    .ops-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
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
    .ops-modal-box {
      background: var(--v2-background-bg-base, #161b22);
      border: 1px solid var(--border-subtle, rgba(255,255,255,0.12));
      border-radius: 12px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.65);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: var(--v2-text-text-base, #e6edf3);
      font-family: inherit;
      animation: ops-scale-up 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes ops-scale-up {
      from { transform: scale(0.97); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .ops-modal-header {
      height: 44px;
      padding: 0 16px;
      border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--v2-background-bg-deep, #0d1117);
      flex-shrink: 0;
      gap: 12px;
    }
    .ops-modal-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--v2-text-text-base, #f0f6fc);
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ops-modal-close {
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
      flex-shrink: 0;
    }
    .ops-modal-close:hover {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }

    /* File Explorer Specific Styles */
    .ops-files-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      height: calc(100% - 44px);
      overflow: hidden;
    }
    @media (max-width: 768px) {
      .ops-files-layout {
        grid-template-columns: 1fr;
      }
    }
    .ops-files-sidebar {
      background: var(--v2-background-bg-deep, #0d1117);
      border-right: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .ops-search-wrapper {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.02);
    }
    .ops-search-input {
      width: 100%;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #e6edf3;
      padding: 5px 8px;
      font-size: 12px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .ops-search-input:focus {
      border-color: #58a6ff;
    }
    .ops-files-tree {
      flex: 1;
      overflow-y: auto;
      padding: 6px 4px;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 12px;
    }
    .ops-tree-node {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 6px;
      border-radius: 5px;
      cursor: pointer;
      color: #c9d1d9;
      user-select: none;
      transition: background 0.1s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ops-tree-node:hover {
      background: rgba(255,255,255,0.06);
      color: #fff;
    }
    .ops-tree-node.selected {
      background: rgba(56, 139, 253, 0.18);
      color: #58a6ff;
    }
    .ops-tree-arrow {
      width: 12px;
      height: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #8b949e;
      flex-shrink: 0;
    }
    .ops-tree-children {
      padding-left: 14px;
    }

    /* Code Viewer Panel */
    .ops-code-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #0d1117;
      overflow: hidden;
    }
    .ops-code-bar {
      height: 40px;
      padding: 0 14px;
      border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #161b22;
      font-size: 11.5px;
      color: #8b949e;
      flex-shrink: 0;
      gap: 8px;
    }
    .ops-code-bar-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ops-btn-action {
      padding: 3px 8px;
      font-size: 11px;
      font-family: inherit;
      color: #c9d1d9;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .ops-btn-action:hover {
      background: rgba(255,255,255,0.12);
      color: #fff;
    }
    .ops-code-container {
      flex: 1;
      overflow: auto;
      background: #0d1117;
      position: relative;
    }
    .ops-code-table {
      border-collapse: collapse;
      width: 100%;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 12px;
      line-height: 1.6;
    }
    .ops-code-table tr {
      height: 20px;
    }
    .ops-code-table tr:hover {
      background: rgba(255, 255, 255, 0.04);
    }
    .ops-line-no {
      width: 48px;
      min-width: 48px;
      max-width: 48px;
      padding: 0 12px 0 8px;
      text-align: right;
      color: #484f58;
      user-select: none;
      border-right: 1px solid #21262d;
      background: #0d1117;
      vertical-align: top;
      position: sticky;
      left: 0;
      z-index: 2;
    }
    .ops-line-content {
      padding: 0 16px 0 12px;
      white-space: pre;
      color: #e6edf3;
      vertical-align: top;
      word-break: normal;
    }

    /* Split View Container */
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
      color: #c9d1d9;
    }
    .ops-split-select {
      background: #161b22;
      color: #e6edf3;
      border: 1px solid rgba(128,128,128,0.25);
      border-radius: 5px;
      padding: 2px 6px;
      font-size: 11.5px;
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

  // Helper functions
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getCurrentSessionID() {
    const m = window.location.href.match(/ses_[a-zA-Z0-9]+/);
    return m ? m[0] : null;
  }

  async function getActiveDirectory(sessionID) {
    if (sessionID) {
      try {
        const res = await fetch(`/session/${sessionID}`);
        if (res.ok) {
          const s = await res.json();
          if (s.directory) return s.directory;
        }
      } catch {}
    }
    try {
      const res = await fetch('/path');
      if (res.ok) {
        const p = await res.json();
        if (p.directory && p.directory !== 'C:\\Windows\\System32') return p.directory;
      }
    } catch {}
    try {
      const res = await fetch('/project');
      if (res.ok) {
        const prjs = await res.json();
        if (Array.isArray(prjs) && prjs.length > 0 && prjs[0].worktree) return prjs[0].worktree;
      }
    } catch {}
    return '';
  }

  function closeModals() {
    document.querySelectorAll('.ops-modal-backdrop').forEach(el => el.remove());
    document.querySelectorAll('.ops-pill-btn').forEach(b => b.classList.remove('active'));
    hideTooltip();
  }

  // Floating Portal Tooltip Implementation
  let activeTooltip = null;
  function showTooltip(targetEl, title, shortcut, desc) {
    hideTooltip();
    const rect = targetEl.getBoundingClientRect();
    const tip = document.createElement('div');
    tip.className = 'ops-portal-tooltip';
    tip.innerHTML = `
      <div class="ops-tooltip-header">
        <span>${escapeHtml(title)}</span>
        ${shortcut ? `<span class="ops-tooltip-kbd">${escapeHtml(shortcut)}</span>` : ''}
      </div>
      ${desc ? `<div class="ops-tooltip-desc">${escapeHtml(desc)}</div>` : ''}
    `;
    document.body.appendChild(tip);

    const tipRect = tip.getBoundingClientRect();
    let left = rect.left + (rect.width / 2) - (tipRect.width / 2);
    let top = rect.bottom + 6;

    // Viewport edge guards
    if (left < 8) left = 8;
    if (left + tipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tipRect.width - 8;
    }

    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    activeTooltip = tip;
  }

  function hideTooltip() {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }

  function attachTooltip(el, title, shortcut, desc) {
    el.setAttribute('title', `${title} (${shortcut})`);
    el.addEventListener('mouseenter', () => showTooltip(el, title, shortcut, desc));
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', hideTooltip);
  }

  // 1. Full Workspace File Explorer & Code Viewer
  async function openFiles() {
    closeModals();
    const btn = document.getElementById('ops-btn-files');
    if (btn) btn.classList.add('active');

    const sid = getCurrentSessionID();
    const currentDir = await getActiveDirectory(sid);

    const overlay = document.createElement('div');
    overlay.className = 'ops-modal-backdrop';
    overlay.innerHTML = `
      <div class="ops-modal-box" style="width: 92%; max-width: 1100px; height: 82vh;">
        <div class="ops-modal-header">
          <div class="ops-modal-title">
            ${ICONS.folder}
            <span>Workspace Explorer</span>
            <span style="font-size: 11px; font-weight: normal; color: #8b949e; margin-left: 4px; font-family: monospace;">(${escapeHtml(currentDir || 'Root')})</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="ops-btn-action" id="ops-files-review-btn" title="Open native git changes panel">
              ${ICONS.diff}
              <span>Git Changes</span>
            </button>
            <button class="ops-modal-close" id="ops-files-close" title="Close (Esc)">✕</button>
          </div>
        </div>
        <div class="ops-files-layout">
          <div class="ops-files-sidebar">
            <div class="ops-search-wrapper">
              <span style="color: #6e7681; display: flex;">${ICONS.search}</span>
              <input type="text" class="ops-search-input" id="ops-file-search" placeholder="Filter files in directory..." />
            </div>
            <div class="ops-files-tree" id="ops-tree-root">
              <div style="padding: 14px; color: #6e7681; font-size: 11.5px;">Loading directory...</div>
            </div>
          </div>
          <div class="ops-code-panel">
            <div class="ops-code-bar">
              <span id="ops-code-path" style="font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Select a file on the left to preview</span>
              <div class="ops-code-bar-actions" id="ops-code-actions" style="display: none;">
                <button class="ops-btn-action" id="ops-btn-copy-path">${ICONS.copy} <span>Copy Path</span></button>
                <button class="ops-btn-action" id="ops-btn-copy-code">${ICONS.copy} <span>Copy Code</span></button>
              </div>
            </div>
            <div class="ops-code-container" id="ops-code-view">
              <div style="padding: 32px; color: #484f58; text-align: center; width: 100%;">
                <div style="font-size: 28px; margin-bottom: 8px;">📄</div>
                <div>Select any code or text file from the explorer to read its content</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => {
      overlay.remove();
      if (btn) btn.classList.remove('active');
    };
    overlay.querySelector('#ops-files-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Link to native OpenCode review panel
    overlay.querySelector('#ops-files-review-btn').addEventListener('click', () => {
      close();
      const reviewToggle = document.querySelector('button.group\\/review-toggle, button[aria-controls="review-panel"]');
      if (reviewToggle) reviewToggle.click();
    });

    const treeRoot = overlay.querySelector('#ops-tree-root');
    const searchInput = overlay.querySelector('#ops-file-search');
    const codeView = overlay.querySelector('#ops-code-view');
    const pathLabel = overlay.querySelector('#ops-code-path');
    const actionsBar = overlay.querySelector('#ops-code-actions');
    const copyPathBtn = overlay.querySelector('#ops-btn-copy-path');
    const copyCodeBtn = overlay.querySelector('#ops-btn-copy-code');

    let currentSelectedPath = '';
    let currentCodeText = '';
    let rootEntries = [];

    // Load file list from API
    async function loadDir(subPath) {
      try {
        const query = `/file?path=${encodeURIComponent(subPath || '')}&directory=${encodeURIComponent(currentDir)}`;
        const res = await fetch(query);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.error('Failed to load dir:', err);
        return [];
      }
    }

    // Render tree nodes recursively
    async function renderTree(container, subPath, filterText) {
      const items = await loadDir(subPath);
      if (!subPath) rootEntries = items;

      container.innerHTML = '';
      if (!items || items.length === 0) {
        container.innerHTML = '<div style="padding: 10px; color: #6e7681;">Empty directory</div>';
        return;
      }

      // Sort: directories first, then files alphabetically
      items.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });

      items.forEach(item => {
        if (filterText && !item.name.toLowerCase().includes(filterText.toLowerCase())) {
          return;
        }

        const isDir = item.type === 'directory';
        const node = document.createElement('div');
        node.className = 'ops-tree-node';

        const arrowSpan = document.createElement('span');
        arrowSpan.className = 'ops-tree-arrow';
        arrowSpan.innerHTML = isDir ? ICONS.chevronRight : '';

        const iconSpan = document.createElement('span');
        iconSpan.style.display = 'inline-flex';
        iconSpan.style.color = isDir ? '#e3b341' : getFileIconColor(item.name);
        iconSpan.innerHTML = isDir ? ICONS.folder : ICONS.file;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name;

        node.appendChild(arrowSpan);
        node.appendChild(iconSpan);
        node.appendChild(nameSpan);

        container.appendChild(node);

        if (isDir) {
          const childrenContainer = document.createElement('div');
          childrenContainer.className = 'ops-tree-children';
          childrenContainer.style.display = 'none';
          container.appendChild(childrenContainer);

          let isOpen = false;
          let loaded = false;

          node.addEventListener('click', async (e) => {
            e.stopPropagation();
            isOpen = !isOpen;
            arrowSpan.innerHTML = isOpen ? ICONS.chevronDown : ICONS.chevronRight;
            iconSpan.innerHTML = isOpen ? ICONS.folderOpen : ICONS.folder;
            childrenContainer.style.display = isOpen ? 'block' : 'none';

            if (isOpen && !loaded) {
              childrenContainer.innerHTML = '<div style="padding: 4px 8px; color: #6e7681;">Loading...</div>';
              await renderTree(childrenContainer, item.path, '');
              loaded = true;
            }
          });
        } else {
          node.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.querySelectorAll('.ops-tree-node').forEach(n => n.classList.remove('selected'));
            node.classList.add('selected');
            loadFile(item.path, item.name);
          });
        }
      });
    }

    // Colored file icon based on file extension
    function getFileIconColor(name) {
      const ext = name.split('.').pop().toLowerCase();
      switch (ext) {
        case 'ts': case 'tsx': return '#3178c6';
        case 'js': case 'jsx': case 'mjs': return '#f7df1e';
        case 'py': return '#3572A5';
        case 'json': return '#fbc02d';
        case 'md': return '#58a6ff';
        case 'css': case 'scss': return '#563d7c';
        case 'html': return '#e34c26';
        case 'svg': case 'png': case 'jpg': case 'jpeg': return '#a371f7';
        default: return '#8b949e';
      }
    }

    // Load and render file content
    async function loadFile(relPath, fileName) {
      currentSelectedPath = relPath;
      actionsBar.style.display = 'inline-flex';
      pathLabel.innerHTML = `
        <span style="color:#e6edf3;font-weight:600;">${escapeHtml(fileName)}</span>
        <span style="color:#6e7681;margin-left:6px;font-size:11px;">Loading...</span>
        <span style="color:#484f58;margin-left:6px;font-size:10.5px;">(${escapeHtml(relPath)})</span>
      `;
      codeView.innerHTML = '<div style="padding: 24px; color: #8b949e;">Loading file content...</div>';

      try {
        const query = `/file/content?path=${encodeURIComponent(relPath)}&directory=${encodeURIComponent(currentDir)}`;
        const res = await fetch(query);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Image preview check
        const ext = fileName.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
          const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
          const imgSrc = data.type === 'binary' ? `data:${mime};base64,${data.content}` : `data:${mime};utf8,${encodeURIComponent(data.content)}`;
          pathLabel.innerHTML = `
            <span style="color:#e6edf3;font-weight:600;">${escapeHtml(fileName)}</span>
            <span style="color:#6e7681;margin-left:6px;font-size:11px;">Image preview</span>
            <span style="color:#484f58;margin-left:6px;font-size:10.5px;">(${escapeHtml(relPath)})</span>
          `;
          codeView.innerHTML = `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; background: #0d1117; width: 100%; height: 100%;">
              <img src="${imgSrc}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 24px rgba(0,0,0,0.6);" />
            </div>
          `;
          currentCodeText = '';
          return;
        }

        let text = data.content || '';
        if (data.type === 'binary') {
          try {
            text = atob(text);
          } catch {
            pathLabel.innerHTML = `
              <span style="color:#e6edf3;font-weight:600;">${escapeHtml(fileName)}</span>
              <span style="color:#6e7681;margin-left:6px;font-size:11px;">Binary file</span>
              <span style="color:#484f58;margin-left:6px;font-size:10.5px;">(${escapeHtml(relPath)})</span>
            `;
            codeView.innerHTML = '<div style="padding: 24px; color: #8b949e;">Binary file content cannot be displayed as text.</div>';
            return;
          }
        }
        currentCodeText = text;

        const lines = text.split('\n');
        const sizeKB = (new Blob([text]).size / 1024).toFixed(1);
        pathLabel.innerHTML = `
          <span style="color:#e6edf3;font-weight:600;">${escapeHtml(fileName)}</span>
          <span style="color:#6e7681;margin-left:6px;font-size:11px;">${lines.length} lines • ${sizeKB} KB</span>
          <span style="color:#484f58;margin-left:6px;font-size:10.5px;">(${escapeHtml(relPath)})</span>
        `;

        const maxLines = 5000;
        const displayLines = lines.slice(0, maxLines);

        let tableRows = '';
        for (let i = 0; i < displayLines.length; i++) {
          const lineNum = i + 1;
          const lineCode = escapeHtml(displayLines[i]);
          tableRows += `<tr><td class="ops-line-no">${lineNum}</td><td class="ops-line-content">${lineCode || '&nbsp;'}</td></tr>`;
        }

        if (lines.length > maxLines) {
          tableRows += `<tr><td class="ops-line-no">...</td><td class="ops-line-content" style="color:#8b949e;font-style:italic;">Showing first ${maxLines} of ${lines.length} lines</td></tr>`;
        }

        codeView.innerHTML = `
          <table class="ops-code-table">
            <tbody>${tableRows}</tbody>
          </table>
        `;
      } catch (err) {
        codeView.innerHTML = `<div style="padding: 24px; color: #f85149;">Error loading file: ${escapeHtml(err.message)}</div>`;
      }
    }

    // Filter file search
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      renderTree(treeRoot, '', q);
    });

    // Copy Path and Code
    copyPathBtn.addEventListener('click', () => {
      if (!currentSelectedPath) return;
      navigator.clipboard.writeText(currentSelectedPath);
      copyPathBtn.querySelector('span').textContent = 'Copied!';
      setTimeout(() => copyPathBtn.querySelector('span').textContent = 'Copy Path', 1500);
    });
    copyCodeBtn.addEventListener('click', () => {
      if (!currentCodeText) return;
      navigator.clipboard.writeText(currentCodeText);
      copyCodeBtn.querySelector('span').textContent = 'Copied!';
      setTimeout(() => copyCodeBtn.querySelector('span').textContent = 'Copy Code', 1500);
    });

    // Initial Tree Render
    renderTree(treeRoot, '', '');
  }

  // 2. Multi-Session Split Monitor
  let splitActive = false;
  async function toggleSplit() {
    const btn = document.getElementById('ops-btn-split');
    if (splitActive) {
      document.querySelector('.ops-split-wrapper')?.remove();
      splitActive = false;
      if (btn) btn.classList.remove('active');
      return;
    }

    const sessions = await fetch('/session').then(r => r.json()).catch(() => []);
    if (!sessions || sessions.length === 0) return alert('No sessions found.');

    splitActive = true;
    if (btn) btn.classList.add('active');

    const s1 = sessions[0]?.id || '';
    const s2 = sessions[1]?.id || s1;

    const opts = (sel) => sessions.map(s =>
      `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${escapeHtml(s.title || s.slug || s.id)}</option>`
    ).join('');

    const wrapper = document.createElement('div');
    wrapper.className = 'ops-split-wrapper';
    wrapper.innerHTML = `
      <div class="ops-split-card">
        <div class="ops-split-card-header">
          <span>Session 1: <select class="ops-split-select" id="ops-s1">${opts(s1)}</select></span>
          <button style="background:transparent;border:none;color:#888;cursor:pointer;" class="ops-close-split">✕</button>
        </div>
        <iframe class="ops-split-frame" id="ops-f1" src="/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${s1}"></iframe>
      </div>
      <div class="ops-split-card">
        <div class="ops-split-card-header">
          <span>Session 2: <select class="ops-split-select" id="ops-s2">${opts(s2)}</select></span>
          <button style="background:transparent;border:none;color:#888;cursor:pointer;" class="ops-close-split">✕</button>
        </div>
        <iframe class="ops-split-frame" id="ops-f2" src="/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${s2}"></iframe>
      </div>
    `;

    document.body.appendChild(wrapper);
    wrapper.querySelectorAll('.ops-close-split').forEach(b => {
      b.addEventListener('click', () => {
        wrapper.remove();
        splitActive = false;
        if (btn) btn.classList.remove('active');
      });
    });
    wrapper.querySelector('#ops-s1').addEventListener('change', e => {
      wrapper.querySelector('#ops-f1').src = `/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${e.target.value}`;
    });
    wrapper.querySelector('#ops-s2').addEventListener('change', e => {
      wrapper.querySelector('#ops-f2').src = `/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${e.target.value}`;
    });
  }

  // 3. Compact Toolbar Injection into Header
  function injectToolbar() {
    if (document.getElementById('opencode-powersuite-pill')) return;

    // Look for OpenCode titlebar container
    const targetContainer = document.querySelector('#opencode-titlebar-right') || document.querySelector('header > div');
    if (!targetContainer) return;

    const pill = document.createElement('div');
    pill.id = 'opencode-powersuite-pill';
    pill.className = 'ops-toolbar-pill';

    pill.innerHTML = `
      <button type="button" class="ops-pill-btn" id="ops-btn-files">
        ${ICONS.folder}
        <span>Files</span>
      </button>
      <button type="button" class="ops-pill-btn" id="ops-btn-split">
        ${ICONS.split}
        <span>Split</span>
      </button>
    `;

    const btnFiles = pill.querySelector('#ops-btn-files');
    const btnSplit = pill.querySelector('#ops-btn-split');

    btnFiles.addEventListener('click', openFiles);
    btnSplit.addEventListener('click', toggleSplit);

    // Attach Portal Tooltips with rich description & shortcuts
    attachTooltip(btnFiles, 'Workspace Explorer', 'Alt + F', 'Duyệt cây thư mục và đọc nhanh mã nguồn dự án');
    attachTooltip(btnSplit, 'Split Screen View', 'Alt + S', 'Mở 2 phiên làm việc song song trên cùng màn hình');

    targetContainer.appendChild(pill);
  }

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModals();
    } else if (e.altKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      openFiles();
    } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      toggleSplit();
    }
  });

  // Observe DOM for header appearance
  const observer = new MutationObserver(injectToolbar);
  function start() {
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
      injectToolbar();
      setTimeout(injectToolbar, 400);
      setTimeout(injectToolbar, 1200);
    } else {
      setTimeout(start, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  console.log('[OpenCode WebUI] Power Suite v6.1 active');
})();
