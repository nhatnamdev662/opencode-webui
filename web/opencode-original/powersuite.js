// OpenCode WebUI Power Suite v7.0 (100% Native Integration)
// - Completely eliminates clumsy/ugly modal popup dialogs
// - Unlocks OpenCode's native File Tree (showFileTree) in settings.v3
// - Seamlessly toggles native docked side panel with full workspace file browsing & diff tabs
// - Rich floating portal tooltips with shortcut badges & clear descriptions
// - Multi-Session Split Monitor (Alt+S)

(function() {
  'use strict';

  // Prevent multiple executions
  if (window.__OPENCODE_POWERSUITE_LOADED__) return;
  window.__OPENCODE_POWERSUITE_LOADED__ = true;

  // Auto-enable OpenCode native file tree & reasoning summaries in settings.v3
  try {
    const raw = localStorage.getItem('settings.v3');
    let s = raw ? JSON.parse(raw) : { general: {} };
    if (!s.general) s.general = {};
    let changed = false;
    if (s.general.showReasoningSummaries !== true) {
      s.general.showReasoningSummaries = true;
      changed = true;
    }
    if (s.general.showFileTree !== true) {
      s.general.showFileTree = true;
      changed = true;
    }
    if (changed) {
      localStorage.setItem('settings.v3', JSON.stringify(s));
    }
  } catch {}

  const ICONS = {
    folder: `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M1 2.75C1 1.784 1.784 1 2.75 1h3.086c.464 0 .91.184 1.238.513l1.414 1.414c.328.329.774.513 1.238.513H13.25c.966 0 1.75.784 1.75 1.75v7.06A1.75 1.75 0 0113.25 14H2.75A1.75 1.75 0 011 12.25V2.75z"/></svg>`,
    split: `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path fill-rule="evenodd" d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0114.25 15H1.75A1.75 1.75 0 010 13.25V2.75zm1.5.25v10c0 .138.112.25.25.25h5.5V3H1.75a.25.25 0 00-.25.25zm7.25 10.25h5.5a.25.25 0 00.25-.25V3a.25.25 0 00-.25-.25h-5.5v10.5z"/></svg>`
  };

  const STYLE = document.createElement('style');
  STYLE.id = 'opencode-powersuite-v7-style';
  STYLE.textContent = `
    /* Sleek Native Toolbar Pill */
    .ops-toolbar-pill {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      margin-left: 6px;
      margin-right: 4px;
      padding: 2px 3px;
      height: 26px;
      box-sizing: border-box;
      background: var(--v2-background-bg-base, #161b22);
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.09));
      border-radius: 7px;
      z-index: 30;
      flex-shrink: 0;
      user-select: none;
    }
    .ops-pill-btn {
      height: 22px;
      padding: 0 7px;
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
      font-size: 11px;
      font-weight: 500;
      font-family: inherit;
      line-height: 1;
    }
    .ops-pill-btn:hover {
      background: var(--v2-overlay-simple-overlay-hover, rgba(128, 128, 128, 0.16));
      color: var(--v2-text-text-base, #f0f6fc);
    }
    .ops-pill-btn.active {
      background: rgba(56, 139, 253, 0.2);
      color: #58a6ff;
    }
    .ops-pill-btn svg {
      flex-shrink: 0;
      pointer-events: none;
    }

    /* Floating Portal Tooltip (appended to document.body, zero overflow clipping) */
    .ops-portal-tooltip {
      position: fixed;
      padding: 7px 11px;
      border-radius: 7px;
      font-size: 11.5px;
      font-family: inherit;
      background: #1c2128;
      color: #f0f6fc;
      border: 1px solid #30363d;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6);
      pointer-events: none;
      z-index: 9999999;
      animation: ops-tooltip-pop 0.12s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      gap: 3px;
      max-width: 260px;
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
      font-size: 12px;
    }
    .ops-tooltip-kbd {
      padding: 1px 5px;
      font-size: 10px;
      font-family: 'JetBrains Mono', Consolas, monospace;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 4px;
      color: #58a6ff;
    }
    .ops-tooltip-desc {
      font-size: 11px;
      color: #8b949e;
      line-height: 1.4;
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
      animation: ops-fade-in 0.15s ease;
    }
    @keyframes ops-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Floating Portal Tooltip Management
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

  // 1. Native OpenCode File Tree & Review Panel Toggle
  function toggleFiles() {
    hideTooltip();

    // 1. Try native file-tree button in titlebar
    const fileTreeBtn = document.querySelector('button[aria-controls="file-tree-panel"]');
    if (fileTreeBtn) {
      fileTreeBtn.click();
      return;
    }

    // 2. Try native review panel toggle in titlebar
    const reviewBtn = document.querySelector('button.group\\/review-toggle, button[aria-controls="review-panel"]');
    if (reviewBtn) {
      reviewBtn.click();
      setTimeout(() => {
        // If panel opened, switch to file browser tab if available
        const fileTab = document.querySelector('[role="tab"][id*="file"], button[id*="file-browser"], .session-review-v2-sidebar-toggle');
        if (fileTab && fileTab.getAttribute('aria-selected') !== 'true') {
          fileTab.click();
        }
      }, 80);
      return;
    }

    // 3. Fallback: Trigger native keyboard shortcut mod+\\ (Ctrl+\\)
    const evt = new KeyboardEvent('keydown', {
      key: '\\',
      code: 'Backslash',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(evt);
  }

  // 2. Multi-Session Split Monitor
  let splitActive = false;
  async function toggleSplit() {
    hideTooltip();
    const btn = document.getElementById('ops-btn-split');
    if (splitActive) {
      document.querySelector('.ops-split-wrapper')?.remove();
      splitActive = false;
      if (btn) btn.classList.remove('active');
      return;
    }

    const sessions = await fetch('/session').then(r => r.json()).catch(() => []);
    if (!sessions || sessions.length === 0) return alert('Chưa có phiên làm việc nào.');

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
          <span>Phiên 1: <select class="ops-split-select" id="ops-s1">${opts(s1)}</select></span>
          <button style="background:transparent;border:none;color:#888;cursor:pointer;" class="ops-close-split">✕</button>
        </div>
        <iframe class="ops-split-frame" id="ops-f1" src="/server/aHR0cDovL2xvY2FsaG9zdDozNDU2/session/${s1}"></iframe>
      </div>
      <div class="ops-split-card">
        <div class="ops-split-card-header">
          <span>Phiên 2: <select class="ops-split-select" id="ops-s2">${opts(s2)}</select></span>
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

  // 3. Compact Toolbar Injection
  function injectToolbar() {
    if (document.getElementById('opencode-powersuite-pill')) return;

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

    btnFiles.addEventListener('click', toggleFiles);
    btnSplit.addEventListener('click', toggleSplit);

    attachTooltip(btnFiles, 'Workspace Files', 'Alt + F', 'Bật/tắt thanh duyệt tệp tin dự án & review git tích hợp sẵn');
    attachTooltip(btnSplit, 'Split Screen', 'Alt + S', 'Mở 2 phiên làm việc song song trên cùng màn hình');

    targetContainer.appendChild(pill);
  }

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      hideTooltip();
      if (splitActive) {
        document.querySelector('.ops-split-wrapper')?.remove();
        splitActive = false;
        document.getElementById('ops-btn-split')?.classList.remove('active');
      }
    } else if (e.altKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      toggleFiles();
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

  console.log('[OpenCode WebUI] Power Suite v7.0 active');
})();
