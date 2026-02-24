# Transkit

> Translate Chinese ↔ English anywhere — in your terminal or browser — with a single keystroke.

```bash
f "The quick brown fox"   # → 那只敏捷的棕色狐狸
f "你好，世界"              # → Hello, world
echo "早上好" | f          # → Good morning
```

No UI to open. No tab to switch. Just type `f` and go.

---

## Features

**CLI**
- `f <text>` — auto-detects language, translates instantly
- Pipe support: `echo "text" | f`
- Local cache — repeated translations are instant, no API call
- `f --setup` — one-time interactive API key setup

**Chrome Extension**
- Select any text on any page → translation bubble appears automatically
- One-click copy
- No popup, no right-click menu — zero friction

---

## Quick Start

### CLI

```bash
# 1. Clone & install
git clone https://github.com/yilee/transkit.git
cd transkit
pnpm install && pnpm build

# 2. Register global command
cd packages/cli && npm link

# 3. Set up API key (one time)
f --setup

# 4. Translate
f hello world
```

You'll need a free [Microsoft Translator API key](https://azure.microsoft.com/en-us/products/ai-services/translator) (2M characters/month free tier).

### Chrome Extension

```bash
pnpm --filter @transkit/chrome-extension build
```

1. Go to `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select `packages/chrome-extension/dist/`
3. Click the Transkit icon → enter API Key + Region → **Save**

Now select any text on any page.

---

## CLI Reference

```bash
f <text>                   # auto-detect and translate
f <text> --to zh-Hans      # force target language
f <text> -v                # show language direction [en → zh-Hans]
f <text> --no-cache        # skip cache, always call API
f --setup                  # configure API key
f --help
```

Supported language codes: `en` · `zh-Hans` · `zh-Hant`

---

## How It Works

- Powered by [Microsoft Translator API v3](https://learn.microsoft.com/en-us/azure/ai-services/translator/)
- TypeScript monorepo (pnpm workspaces) — CLI and extension share zero runtime dependencies
- Cache stored in `~/.config/transkit/cache.json`
- Chrome extension uses Manifest V3, no background service worker needed

---

## Project Structure

```
transkit/
├── packages/
│   ├── core/               # Shared translation logic
│   ├── cli/                # Global command: f / transkit
│   └── chrome-extension/   # Selection bubble extension
└── pnpm-workspace.yaml
```

## License

MIT
