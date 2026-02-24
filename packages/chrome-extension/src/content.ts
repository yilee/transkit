// Transkit content script — selection-based translation bubble

const BUBBLE_ID = 'transkit-bubble';
const ENDPOINT = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';
const CHINESE_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/;

// ── language detection ────────────────────────────────────────────────────────

function detectLang(text: string): 'zh-Hans' | 'en' {
  return CHINESE_RE.test(text) ? 'zh-Hans' : 'en';
}

function targetLang(src: 'zh-Hans' | 'en'): 'zh-Hans' | 'en' {
  return src === 'en' ? 'zh-Hans' : 'en';
}

// ── API call ──────────────────────────────────────────────────────────────────

async function translate(text: string): Promise<{ result: string; from: string; to: string }> {
  if (!chrome?.storage?.sync) throw new Error('extension_context_invalid');
  const cfg = await chrome.storage.sync.get(['apiKey', 'region']);
  if (!cfg.apiKey || !cfg.region) throw new Error('no_config');

  const src = detectLang(text);
  const to = targetLang(src);

  const url = `${ENDPOINT}&to=${to}&from=${src}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': cfg.apiKey,
      'Ocp-Apim-Subscription-Region': cfg.region,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ Text: text }]),
  });

  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json() as Array<{ translations: Array<{ text: string }> }>;
  return { result: data[0].translations[0].text, from: src, to };
}

// ── bubble UI ─────────────────────────────────────────────────────────────────

function removeBubble(): void {
  document.getElementById(BUBBLE_ID)?.remove();
}

function showBubble(x: number, y: number, content: string, meta?: string): void {
  removeBubble();

  const bubble = document.createElement('div');
  bubble.id = BUBBLE_ID;

  const text = document.createElement('div');
  text.className = 'transkit-result';
  text.textContent = content;
  bubble.appendChild(text);

  if (meta) {
    const footer = document.createElement('div');
    footer.className = 'transkit-meta';

    const lang = document.createElement('span');
    lang.textContent = meta;
    footer.appendChild(lang);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'transkit-copy';
    copyBtn.title = 'Copy';
    copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(content).then(() => {
        copyBtn.innerHTML = '✓';
        setTimeout(() => {
          copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
        }, 1500);
      });
    });
    footer.appendChild(copyBtn);
    bubble.appendChild(footer);
  }

  // Position: below selection, keep within viewport
  const vw = window.innerWidth;
  bubble.style.left = '0';
  bubble.style.top = '0';
  document.body.appendChild(bubble);

  const bw = bubble.offsetWidth;
  let left = x - bw / 2;
  left = Math.max(8, Math.min(left, vw - bw - 8));
  bubble.style.left = `${left + window.scrollX}px`;
  bubble.style.top = `${y + window.scrollY + 8}px`;
}

function showLoading(x: number, y: number): void {
  showBubble(x, y, '…');
}

function showError(x: number, y: number, msg: string): void {
  showBubble(x, y, msg);
}

// ── event handling ────────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

document.addEventListener('mouseup', (e: MouseEvent) => {
  if ((e.target as Element).closest(`#${BUBBLE_ID}`)) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';

    if (!text || text.length > 500) {
      removeBubble();
      return;
    }

    const range = sel!.getRangeAt(0).getBoundingClientRect();
    const x = range.left + range.width / 2;
    const y = range.bottom;

    showLoading(x, y);

    try {
      const { result, from, to } = await translate(text);
      showBubble(x, y, result, `${from} → ${to}`);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'extension_context_invalid') {
        removeBubble();
      } else if (msg === 'no_config') {
        showError(x, y, 'Transkit: click the extension icon to set up your API key');
      } else {
        showError(x, y, `Transkit: ${msg}`);
      }
    }
  }, 300);
});

document.addEventListener('mousedown', (e: MouseEvent) => {
  if (!(e.target as Element).closest(`#${BUBBLE_ID}`)) {
    removeBubble();
  }
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') removeBubble();
});
