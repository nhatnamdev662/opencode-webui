// OpenCode WebUI Gaslight Feature
// Inject inline edit buttons on assistant text/reasoning parts
// Uses PATCH /session/{sessionID}/message/{messageID}/part/{partID}

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
      color: #8b949e;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      opacity: 0;
      transition: all 0.15s ease;
      position: absolute;
      top: 6px;
      right: 6px;
      z-index: 50;
    }
    .gaslight-btn:hover {
      color: #f0f6fc;
      background: rgba(139,148,158,0.15);
      border-color: rgba(139,148,158,0.3);
    }
    .gaslight-btn svg {
      width: 12px;
      height: 12px;
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
    }
    .gaslight-editor-textarea:focus {
      outline: none;
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

  // SVG icon for edit button
  const PENCIL_SVG = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L3.462 11.1a.25.25 0 00-.064.108l-.631 2.208 2.208-.63a.25.25 0 00.108-.064l8.61-8.61a.25.25 0 000-.354l-1.086-1.086z"/></svg>';

  function showToast(message, type) {
    const t = document.createElement('div');
    t.className = 'gaslight-toast ' + type;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  function openEditor(sessionID, messageID, partID, originalText, partType) {
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
          <div class="gaslight-editor-footer-hint">Esc to cancel</div>
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
    // Move cursor to end
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    const close = () => overlay.remove();

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    btnCancel.addEventListener('click', close);

    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    });

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
        const url = '/session/' + sessionID + '/message/' + messageID + '/part/' + partID;
        const resp = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: partType,
            text: newText,
            id: partID
          })
        });

        if (resp.ok) {
          showToast('Updated successfully! Reload to see changes.', 'success');
          close();
          // Reload page after short delay to reflect changes
          setTimeout(() => window.location.reload(), 800);
        } else {
          const errText = await resp.text();
          showToast('Failed: ' + resp.status + ' ' + errText.slice(0, 100), 'error');
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

  // Parse session/message/part IDs from the page's data and SSE events
  // We store message data globally when we intercept fetch responses
  const messageCache = new Map();

  // Intercept fetch to capture message data
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

    // Capture message list responses
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
          // After caching, inject edit buttons
          setTimeout(() => injectEditButtons(), 300);
        }
      } catch {}
    }

    return response;
  };

  // Extract session ID from current URL or page state
  function getCurrentSessionID() {
    // Try URL hash/path
    const urlMatch = window.location.href.match(/ses_[a-zA-Z0-9]+/);
    if (urlMatch) return urlMatch[0];

    // Try localStorage or page content
    const stored = localStorage.getItem('opencode-active-session');
    if (stored) return stored;

    // Scan messageCache for any session ID
    for (const [, msg] of messageCache) {
      if (msg.info?.sessionID) return msg.info.sessionID;
    }

    return null;
  }

  function injectEditButtons() {
    // Find all message containers that haven't been processed yet
    // OpenCode renders messages in elements with data attributes or specific class patterns
    // We look for text content blocks within assistant messages

    const sessionID = getCurrentSessionID();
    if (!sessionID) return;

    // Strategy: find all rendered message blocks, match them to cached data by text content
    const allMsgs = Array.from(messageCache.values()).filter(m => m.info.role === 'assistant');

    allMsgs.forEach(msg => {
      const editableParts = (msg.parts || []).filter(p =>
        (p.type === 'text' || p.type === 'reasoning') && p.text && p.id
      );

      editableParts.forEach(part => {
        const partId = part.id;
        // Skip if already injected
        if (document.querySelector('[data-gaslight-part="' + partId + '"]')) return;

        // Find the DOM element containing this text
        // Search through all text nodes for a match (first 60 chars)
        const searchText = part.text.trim().substring(0, 60);
        if (!searchText) return;

        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );

        let targetNode = null;
        while (walker.nextNode()) {
          const nodeText = walker.currentNode.textContent || '';
          if (nodeText.trim().startsWith(searchText.substring(0, 30))) {
            targetNode = walker.currentNode;
            break;
          }
        }

        if (!targetNode) return;

        // Find a suitable parent container to attach the button
        let container = targetNode.parentElement;
        // Walk up a few levels to find a block-level element
        for (let i = 0; i < 5; i++) {
          if (!container) break;
          const display = window.getComputedStyle(container).display;
          if (display === 'block' || display === 'flex') break;
          container = container.parentElement;
        }

        if (!container || container.querySelector('[data-gaslight-part]')) return;

        // Make container relative for absolute positioning of button
        container.style.position = 'relative';
        container.setAttribute('data-gaslight-wrap', '1');

        const btn = document.createElement('button');
        btn.className = 'gaslight-btn';
        btn.setAttribute('data-gaslight-part', partId);
        btn.innerHTML = PENCIL_SVG + ' Edit';
        btn.title = 'Edit this ' + (part.type === 'reasoning' ? 'thinking' : 'response');

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openEditor(sessionID, msg.info.id, partId, part.text, part.type);
        });

        container.appendChild(btn);
      });
    });
  }

  // Re-inject on DOM changes (SPA navigation, new messages)
  const observer = new MutationObserver(() => {
    setTimeout(() => injectEditButtons(), 200);
  });

  // Start observing once #root is available
  function startObserving() {
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
      // Initial injection
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

  console.log('[OpenCode WebUI] Gaslight feature loaded');
})();
