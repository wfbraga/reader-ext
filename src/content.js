// src/content.js
// Injects overlay, handles text extraction, block navigation, and speech synthesis

(function() {
  // Overlay UI HTML
  const overlayHTML = `
    <div id="rfh-overlay" style="position:fixed;top:0;left:0;width:100vw;z-index:2147483647;background:#eee;color:#222;box-shadow:0 2px 8px #0002;display:none;align-items:center;gap:8px;padding:8px 16px;font-family:sans-serif;">
      <button id="rfh-prev">⏮️ Last block</button>
      <button id="rfh-pause">⏸️ Pause</button>
      <button id="rfh-next">⏭️ Next block</button>
      <button id="rfh-stop">⏹️ Stop</button>
      <button id="rfh-contrast">🌓 High Contrast</button>
      <span id="rfh-status" style="margin-left:16px;"></span>
    </div>
  `;

  // Insert overlay
  let overlay = document.createElement('div');
  overlay.innerHTML = overlayHTML;
  document.body.prepend(overlay.firstElementChild);
  const bar = document.getElementById('rfh-overlay');

  // State
  let blocks = [];
  let currentIdx = 0;
  let synth = window.speechSynthesis;
  let utter = null;
  let highContrast = false;

  // Block selectors
  const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6,section,article';

  // Highlight helpers
  function highlight(idx) {
    blocks.forEach((el, i) => {
      el.style.outline = (i === idx) ? (highContrast ? '3px solid yellow' : '2px solid #0078d4') : '';
      el.style.background = (i === idx && highContrast) ? '#000' : '';
      el.style.color = (i === idx && highContrast) ? '#fff' : '';
    });
  }
  function clearHighlight() {
    blocks.forEach(el => {
      el.style.outline = '';
      el.style.background = '';
      el.style.color = '';
    });
  }

  // Overlay controls
  const pauseBtn = document.getElementById('rfh-pause');
  document.getElementById('rfh-prev').onclick = () => speakBlock(currentIdx - 1);
  document.getElementById('rfh-next').onclick = () => speakBlock(currentIdx + 1);
  pauseBtn.onclick = () => {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      pauseBtn.textContent = '▶️ Play';
    } else if (synth.paused) {
      synth.resume();
      pauseBtn.textContent = '⏸️ Pause';
    }
  };
  document.getElementById('rfh-stop').onclick = stopReading;
  document.getElementById('rfh-contrast').onclick = () => {
    highContrast = !highContrast;
    bar.style.background = highContrast ? '#222' : '#eee';
    bar.style.color = highContrast ? '#fff' : '#222';
    highlight(currentIdx);
  };

  // Speech logic
  function speakBlock(idx) {
    stopReading();
    if (idx < 0 || idx >= blocks.length) return;
    currentIdx = idx;
    highlight(idx);
    const text = blocks[idx].innerText.trim();
    if (!text) return;
    utter = new SpeechSynthesisUtterance(text);
    utter.lang = detectLang(blocks[idx]) || navigator.language;
    utter.onend = () => {
      pauseBtn.textContent = '⏸️ Pause';
      speakBlock(currentIdx + 1);
    };
    utter.onpause = () => {
      pauseBtn.textContent = '▶️ Play';
    };
    utter.onresume = () => {
      pauseBtn.textContent = '⏸️ Pause';
    };
    synth.speak(utter);
    bar.style.display = 'flex';
    pauseBtn.textContent = '⏸️ Pause';
    document.getElementById('rfh-status').textContent = `Block ${idx + 1} of ${blocks.length}`;
  }
  function stopReading() {
    if (utter) synth.cancel();
    clearHighlight();
    bar.style.display = 'none';
    document.getElementById('rfh-status').textContent = '';
    pauseBtn.textContent = '⏸️ Pause';
  }

  // Language detection
  function detectLang(el) {
    let node = el;
    while (node) {
      if (node.lang) return node.lang;
      node = node.parentElement;
    }
    return document.documentElement.lang || null;
  }

  // Listen for custom event from background
  window.addEventListener('read-from-here', (e) => {
      // If user has selected text, read from selection
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
        stopReading();
        // Read only the selected text
        utter = new SpeechSynthesisUtterance(selection.toString());
        utter.lang = detectLang(selection.anchorNode && selection.anchorNode.parentElement ? selection.anchorNode.parentElement : document.body) || navigator.language;
        utter.onend = () => {
          pauseBtn.textContent = '⏸️ Pause';
        };
        utter.onpause = () => {
          pauseBtn.textContent = '▶️ Play';
        };
        utter.onresume = () => {
          pauseBtn.textContent = '⏸️ Pause';
        };
        synth.speak(utter);
        bar.style.display = 'flex';
        pauseBtn.textContent = '⏸️ Pause';
        document.getElementById('rfh-status').textContent = `Selected text`;
        return;
      }
      // Otherwise, use block logic
      let target = document.activeElement;
      if (!target || target === document.body) target = document.elementFromPoint(e.detail?.clientX || 0, e.detail?.clientY || 0) || document.body;
      let block = target.closest(BLOCK_SELECTOR);
      if (!block) block = document.body;
      // Collect all blocks in document
      blocks = Array.from(document.querySelectorAll(BLOCK_SELECTOR));
      currentIdx = blocks.indexOf(block);
      if (currentIdx < 0) currentIdx = 0;
      speakBlock(currentIdx);
  });

  // Clean up on navigation
  window.addEventListener('beforeunload', stopReading);
})();
