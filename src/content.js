// src/content.js
// Injects overlay, handles text extraction, block navigation, and speech synthesis

(function() {
  // Overlay UI HTML
  const overlayHTML = `
    <div id="rfh-overlay" style="position:fixed;top:0;left:0;width:100vw;z-index:2147483647;background:#eee;color:#222;box-shadow:0 2px 8px #0002;display:none;align-items:center;gap:8px;padding:8px 16px;font-family:sans-serif;flex-wrap:wrap;">
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;width:100%;">
        <button id="rfh-prev">⏮️ Last block</button>
        <button id="rfh-pause">⏸️ Pause</button>
        <button id="rfh-next">⏭️ Next block</button>
        <button id="rfh-stop">⏹️ Stop</button>
        <button id="rfh-contrast">🌓 High Contrast</button>
        <label style="margin-left:8px;display:flex;align-items:center;gap:4px;">
          <span>Voice:</span>
          <select id="rfh-voice" style="max-width:180px;"></select>
        </label>
        <label style="margin-left:8px;display:flex;align-items:center;gap:4px;">
          <span>Speed:</span>
          <input id="rfh-rate" type="range" min="0.5" max="2" step="0.25" value="1" style="width:80px;">
          <span id="rfh-rate-value">1.00</span>
        </label>
        <label for="rfh-highlight" style="margin-left:8px;display:flex;align-items:center;gap:4px;cursor:pointer;">
          <input id="rfh-highlight" type="checkbox" checked aria-checked="true" aria-label="Highlight Text" tabindex="0" style="accent-color:#0078d4; width:16px; height:16px;" />
          <span>Highlight Text</span>
        </label>
        <span id="rfh-status" style="margin-left:16px;"></span>
      </div>
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
  let voices = [];
  let selectedVoice = null;
  let selectedRate = 1.0;
  // Responsive overlay CSS
  const style = document.createElement('style');
  style.textContent = `
    #rfh-overlay { flex-direction: row; flex-wrap: wrap; }
    #rfh-overlay label { min-width: 120px; }
    @media (max-width: 600px) {
      #rfh-overlay > div { flex-direction: column; align-items: stretch; }
      #rfh-overlay label, #rfh-overlay select, #rfh-overlay input[type=range] { width: 100%; min-width: 0; }
      #rfh-overlay button { width: 100%; margin-bottom: 4px; }
    }
  `;
  document.head.appendChild(style);
  // Voice dropdown and rate slider logic
  const voiceSelect = document.getElementById('rfh-voice');
  const rateSlider = document.getElementById('rfh-rate');
  const rateValue = document.getElementById('rfh-rate-value');

  function populateVoices() {
    voices = synth.getVoices();
    voiceSelect.innerHTML = '';
    voices.forEach((voice, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${voice.name} (${voice.lang})${voice.default ? ' [default]' : ''}`;
      voiceSelect.appendChild(opt);
    });
    // Default: prefer Google voice matching page lang, then any Google, then any matching lang, then default
    let pageLang = (document.documentElement.lang || navigator.language || 'en').toLowerCase();
    let googleLangIdx = voices.findIndex(v => (v.name.toLowerCase().includes('google') || (v.voiceURI && v.voiceURI.toLowerCase().includes('google'))) && v.lang.toLowerCase().startsWith(pageLang));
    let googleAnyIdx = voices.findIndex(v => v.name.toLowerCase().includes('google') || (v.voiceURI && v.voiceURI.toLowerCase().includes('google')));
    let langIdx = voices.findIndex(v => v.lang.toLowerCase().startsWith(pageLang));
    let defaultIdx = voices.findIndex(v => v.default);
    if (voices.length > 0) {
      if (googleLangIdx >= 0) {
        voiceSelect.value = googleLangIdx;
        selectedVoice = voices[googleLangIdx];
      } else if (googleAnyIdx >= 0) {
        voiceSelect.value = googleAnyIdx;
        selectedVoice = voices[googleAnyIdx];
      } else if (langIdx >= 0) {
        voiceSelect.value = langIdx;
        selectedVoice = voices[langIdx];
      } else if (defaultIdx >= 0) {
        voiceSelect.value = defaultIdx;
        selectedVoice = voices[defaultIdx];
      } else {
        voiceSelect.value = 0;
        selectedVoice = voices[0];
      }
    }
  }
  populateVoices();
  if (typeof synth.onvoiceschanged !== 'undefined') {
    synth.onvoiceschanged = populateVoices;
  }
  function restartReadingIfActive() {
    if (synth.speaking && !synth.paused) {
      // Resume from current block
      synth.cancel();
      setTimeout(() => {
        if (blocks.length > 0) speakBlock(currentIdx);
      }, 150);
    }
  }
  voiceSelect.onchange = () => {
    selectedVoice = voices[voiceSelect.value];
    restartReadingIfActive();
  };
  rateSlider.oninput = () => {
    selectedRate = parseFloat(rateSlider.value);
    rateValue.textContent = selectedRate.toFixed(2);
    restartReadingIfActive();
  };
  // Set initial rate value
  rateValue.textContent = rateSlider.value;

  // Highlighting setup
  let highlightEnabled = true;
  const highlightCheckbox = document.getElementById('rfh-highlight');
  let currentHighlightedElement = null;
  
  if (highlightCheckbox) {
    highlightCheckbox.addEventListener('change', () => {
      highlightEnabled = highlightCheckbox.checked;
      highlightCheckbox.setAttribute('aria-checked', highlightEnabled ? 'true' : 'false');
      if (!highlightEnabled && currentHighlightedElement) {
        clearTextHighlight();
      }
    });
    highlightCheckbox.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        highlightCheckbox.checked = !highlightCheckbox.checked;
        highlightCheckbox.dispatchEvent(new Event('change'));
      }
    });
  }

  // Text highlighting functions
  function clearTextHighlight() {
    if (currentHighlightedElement) {
      currentHighlightedElement.style.backgroundColor = '';
      currentHighlightedElement.style.color = '';
      currentHighlightedElement.style.padding = '';
      currentHighlightedElement.style.borderRadius = '';
      currentHighlightedElement = null;
    }
  }

  function highlightText(element, charIndex, length) {
    if (!highlightEnabled || !element) return;
    
    clearTextHighlight();
    
    try {
      const text = element.textContent;
      if (charIndex >= 0 && charIndex + length <= text.length) {
        // Simple approach: highlight the entire element
        element.style.backgroundColor = '#1976d2';
        element.style.color = '#fff';
        element.style.padding = '2px 4px';
        element.style.borderRadius = '2px';
        currentHighlightedElement = element;
      }
    } catch (err) {
      // Silently fail to not interrupt speech
    }
  }

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
    const block = blocks[idx];
    const text = block.innerText.trim();
    if (!text) return;
    utter = new SpeechSynthesisUtterance(text);
    utter.lang = detectLang(block) || navigator.language;
    if (selectedVoice) utter.voice = selectedVoice;
    utter.rate = selectedRate;
    utter.onend = () => {
      pauseBtn.textContent = '⏸️ Pause';
      clearTextHighlight();
      speakBlock(currentIdx + 1);
    };
    utter.onpause = () => {
      pauseBtn.textContent = '▶️ Play';
    };
    utter.onresume = () => {
      pauseBtn.textContent = '⏸️ Pause';
    };
    
    // Add text highlighting synchronization
    if ('onboundary' in utter) {
      utter.onboundary = function(event) {
        if (event.name === 'word' && highlightEnabled) {
          highlightText(block, event.charIndex, event.charLength || 1);
        }
      };
    }
    // Chrome bug workaround: cancel before speak, and use setTimeout
    if (synth.speaking) synth.cancel();
    setTimeout(() => {
      try {
        synth.speak(utter);
      } catch (e) {
        console.error('Failed to speak with selected voice:', selectedVoice, e);
      }
    }, 150);
    bar.style.display = 'flex';
    pauseBtn.textContent = '⏸️ Pause';
    document.getElementById('rfh-status').textContent = `Block ${idx + 1} of ${blocks.length}`;
  }
  function stopReading() {
    if (utter) synth.cancel();
    clearHighlight();
    clearTextHighlight();
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

  // Listen for messages from background (Manifest V3 compatible)
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'READ_FROM_HERE') {
      // If user has selected text, read from selection
      const selection = window.getSelection();
      if (msg.mode === 'selection') {
        if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
          stopReading();
          utter = new SpeechSynthesisUtterance(selection.toString());
          utter.lang = detectLang(selection.anchorNode && selection.anchorNode.parentElement ? selection.anchorNode.parentElement : document.body) || navigator.language;
          if (selectedVoice) utter.voice = selectedVoice;
          utter.rate = selectedRate;
          utter.onend = () => {
            pauseBtn.textContent = '⏸️ Pause';
          };
          utter.onpause = () => {
            pauseBtn.textContent = '▶️ Play';
          };
          utter.onresume = () => {
            pauseBtn.textContent = '⏸️ Pause';
          };
          if (synth.speaking) synth.cancel();
          setTimeout(() => {
            try {
              synth.speak(utter);
            } catch (e) {
              console.error('Failed to speak with selected voice:', selectedVoice, e);
            }
          }, 150);
          bar.style.display = 'flex';
          pauseBtn.textContent = '⏸️ Pause';
          document.getElementById('rfh-status').textContent = `Selected text`;
          return;
        }
      } else if (msg.mode === 'from-here') {
        if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
          // Find the block containing the selection's anchorNode
          let anchorNode = selection.anchorNode;
          let block = anchorNode ? (anchorNode.nodeType === 1 ? anchorNode : anchorNode.parentElement).closest(BLOCK_SELECTOR) : null;
          // Collect all blocks in document order
          const allBlocks = Array.from(document.querySelectorAll(BLOCK_SELECTOR));
          const startIdx = block ? allBlocks.indexOf(block) : -1;
          // Read selection first
          stopReading();
          utter = new SpeechSynthesisUtterance(selection.toString());
          utter.lang = detectLang(block || document.body) || navigator.language;
          if (selectedVoice) utter.voice = selectedVoice;
          utter.rate = selectedRate;
          utter.onend = () => {
            pauseBtn.textContent = '⏸️ Pause';
            // After selection, continue with the rest of the current block, then move to next blocks
            if (block) {
              // Get all text nodes in the block
              let walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
              let textNodes = [];
              let node;
              while ((node = walker.nextNode())) {
                textNodes.push(node);
              }
              // Find the text node and offset where the selection ends
              let selEndNode = selection.focusNode;
              let selEndOffset = selection.focusOffset;
              let foundEnd = false;
              let afterText = '';
              for (let tn of textNodes) {
                if (foundEnd) {
                  afterText += tn.textContent;
                } else if (tn === selEndNode) {
                  afterText += tn.textContent.substring(selEndOffset);
                  foundEnd = true;
                }
              }
              if (afterText.trim().length > 0) {
                // Read the rest of the current block
                let blockUtter = new SpeechSynthesisUtterance(afterText);
                blockUtter.lang = detectLang(block) || navigator.language;
                if (selectedVoice) blockUtter.voice = selectedVoice;
                blockUtter.rate = selectedRate;
                blockUtter.onend = () => {
                  // After finishing the block, continue with next blocks
                  if (startIdx >= 0 && startIdx < allBlocks.length - 1) {
                    blocks = allBlocks.slice(startIdx + 1);
                    currentIdx = 0;
                    speakBlock(currentIdx);
                  }
                };
                blockUtter.onpause = () => { pauseBtn.textContent = '▶️ Play'; };
                blockUtter.onresume = () => { pauseBtn.textContent = '⏸️ Pause'; };
                if (synth.speaking) synth.cancel();
                setTimeout(() => {
                  try {
                    synth.speak(blockUtter);
                  } catch (e) {
                    console.error('Failed to speak with selected voice:', selectedVoice, e);
                  }
                }, 150);
                bar.style.display = 'flex';
                pauseBtn.textContent = '⏸️ Pause';
                document.getElementById('rfh-status').textContent = `Selected text + block + page`;
                return;
              } else {
                // No more text in block, continue with next blocks
                if (startIdx >= 0 && startIdx < allBlocks.length - 1) {
                  blocks = allBlocks.slice(startIdx + 1);
                  currentIdx = 0;
                  speakBlock(currentIdx);
                }
              }
            }
          };
          utter.onpause = () => { pauseBtn.textContent = '▶️ Play'; };
          utter.onresume = () => { pauseBtn.textContent = '⏸️ Pause'; };
          if (synth.speaking) synth.cancel();
          setTimeout(() => {
            try {
              synth.speak(utter);
            } catch (e) {
              console.error('Failed to speak with selected voice:', selectedVoice, e);
            }
          }, 150);
          bar.style.display = 'flex';
          pauseBtn.textContent = '⏸️ Pause';
          document.getElementById('rfh-status').textContent = `Selected text + block + page`;
          return;
        }
      }
      // Default: read page from here (no selection or fallback)
      let target = document.activeElement;
      if (!target || target === document.body) target = document.elementFromPoint(msg.clientX || 0, msg.clientY || 0) || document.body;
      let block = target.closest(BLOCK_SELECTOR);
      if (!block) block = document.body;
      // Collect all blocks in document order
      const allBlocks = Array.from(document.querySelectorAll(BLOCK_SELECTOR));
      const startIdx = allBlocks.indexOf(block);
      blocks = startIdx >= 0 ? allBlocks.slice(startIdx) : allBlocks;
      currentIdx = 0;
      speakBlock(currentIdx);
    }
  });

  // Clean up on navigation
  window.addEventListener('beforeunload', stopReading);
})();
