// OpenCode WebUI Gaslight Feature v2
// - Fixed 400 error: PATCH body must include sessionID + messageID
// - Always-visible Edit button (subtle, clean)
// - Editor closes ONLY via Cancel button or Escape (never on outside click / text selection)

(function() {
  'use strict';

  const STYLE = document.createElement('style');
  STYLE.textContent = `
    .gaslight-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      font-size: 11px;
      font-family: monospace;
      color: #6e7681;
      background: transparent;
      border: 1px solid #21262d;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      position: absolute;
      top: 6px;
      right: 6px;
      z-index: 50;
      opacity: 0.35;
    }
    .gaslight-btn:hover {
      color: #f0f6fc;
      background: rgba(139,148,158,0.15);
      border-color: rgba(139,148,158,0.4);
      opacity: 1;
    }
    .gaslight-btn svg {
      width: 12px;
      height: 12px;
      pointer-events: none;
    }
    [data-gaslight-wrap]:hover .gaslight-btn {
      opacity: 1;
    }

    .gaslight-editor-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 9999;
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
      max-width: 720px;
      max-height: 80vh;
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
      min-height: 200px;
      max-height: 60vh;
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
      color: #484f58;
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
      z-index: 99999;
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

  function showToast(message, type) {
    const t = document.createElement('div');
    t.className = 'gaslight-toast ' + type;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  function openEditor(sessionID, messageID, partID, originalText, partType, fullPart) {
    // Close any existing editor first
    document.querySelectorAll('.gaslight-editor-overlay').forEach(o => o.remove());

    const overlay = document.createElement('div');
    overlay.className = 'gaslight-editor-overlay';

    const label = partType === 'reasoning' ? 'Thinking / Reasoning' : 'Response Text';

    overlay.innerHTML = `
      <div class="gaslight-editor-box">
        <div class="gaslight-editor-header">
          <div>
            <div class="gaslight-editor-title">Edit ${label}</div>
            <div class="gaslight-editor-subtitle">Part: ${partID}</div>
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
      document.removeEventListener('keydown', escHandler);
      overlay.remove();
    };

    // ONLY Cancel button and Escape close the editor.
    // Clicking outside / on overlay does NOTHING (so text selection and drags are safe)
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
        // CRITICAL FIX: PATCH body must include sessionID + messageID
        const payload = Object.assign({}, fullPart, { text: newText });
        const url = '/session/' + sessionID + '/message/' + messageID + '/part/' + partID;
        const resp = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (resp.ok) {
          showToast('Updated! Reloading...', 'success');
          close();
          setTimeout(() => window.location.reload(), 600);
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

  const messageCache = new Map();

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

    if (url.match(/\/session\/ses_[^/]+\/message/) && !url.includes('/part/')) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        if (Array.isArray(data)) {
          data.forEach(msg => {
            if (msg?.info?.id) {
              messageCache.set(msg.info.id, msg);
            }
          });
          setTimeout(() => injectEditButtons(), 300);
        }
      } catch {}
    }

    return response;
  };

  function getCurrentSessionID() {
    const urlMatch = window.location.href.match(/ses_[a-zA-Z0-9]+/);
    if (urlMatch) return urlMatch[0];
    for (const [, msg] of messageCache) {
      if (msg.info?.sessionID) return msg.info.sessionID;
    }
    return null;
  }

  function injectEditButtons() {
    const sessionID = getCurrentSessionID();
    if (!sessionID) return;

    const allMsgs = Array.from(messageCache.values()).filter(m => m.info.role === 'assistant');

    allMsgs.forEach(msg => {
      const editableParts = (msg.parts || []).filter(p =>
        (p.type === 'text' || p.type === 'reasoning') && p.text && p.id
      );

      editableParts.forEach(part => {
        const partId = part.id;
        if (document.querySelector('[data-gaslight-part="' + partId + '"]')) return;

        const searchText = part.text.trim().substring(0, 60);
        if (!searchText) return;

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);

        let targetNode = null;
        while (walker.nextNode()) {
          const nodeText = walker.currentNode.textContent || '';
          if (nodeText.trim().startsWith(searchText.substring(0, 30))) {
            targetNode = walker.currentNode;
            break;
          }
        }

        if (!targetNode) return;

        let container = targetNode.parentElement;
        for (let i = 0; i < 5; i++) {
          if (!container) break;
          const display = window.getComputedStyle(container).display;
          if (display === 'block' || display === 'flex') break;
          container = container.parentElement;
        }

        if (!container || container.querySelector('[data-gaslight-part]')) return;

        container.style.position = container.style.position || 'relative';
        container.setAttribute('data-gaslight-wrap', '1');

        const btn = document.createElement('button');
        btn.className = 'gaslight-btn';
        btn.setAttribute('data-gaslight-part', partId);
        btn.innerHTML = PENCIL_SVG + ' Edit';
        btn.title = 'Edit this ' + (part.type === 'reasoning' ? 'thinking' : 'response');

        // Prevent click from bubbling into app handlers
        btn.addEventListener('mousedown', (e) => e.stopPropagation());
        btn.addEventListener('mouseup', (e) => e.stopPropagation());
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openEditor(sessionID, msg.info.id, partId, part.text, part.type, part);
        });

        container.appendChild(btn);
      });
    });
  }

  const observer = new MutationObserver(() => {
    setTimeout(() => injectEditButtons(), 200);
  });

  function startObserving() {
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
      setTimeout(() => injectEditButtons(), 1000);
    } else {
      setTimeout(startObserving, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
  } else {
    startObserving();
  }

  console.log('[OpenCode WebUI] Gaslight v2 loaded');
})();
